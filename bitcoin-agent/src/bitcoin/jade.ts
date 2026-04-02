import { SerialPort } from 'serialport';
import { encode, decode } from 'cbor-x';

const JADE_BAUD_RATE = 115200;
const JADE_USB_VENDOR_ID = '10c4'; // Silicon Labs (Jade USB chip)
const SIGN_TIMEOUT_MS = 120_000; // 2 minutes — user must confirm on device

interface JadeDevice {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
}

interface JadeRpcRequest {
  method: string;
  id: string;
  params?: Record<string, unknown>;
}

interface JadeRpcResponse {
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}

let msgId = 0;

function nextId(): string {
  return String(++msgId);
}

export async function listJadeDevices(): Promise<JadeDevice[]> {
  const ports = await SerialPort.list();
  // Filter for likely Jade devices (Silicon Labs USB-to-UART bridge)
  // Also match usbmodem paths on macOS which Jade may use
  return ports
    .filter(
      (p) =>
        p.vendorId?.toLowerCase() === JADE_USB_VENDOR_ID ||
        p.path.includes('usbmodem') ||
        p.path.includes('ttyACM') ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes('silicon'))
    )
    .map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
    }));
}

function sendRequest(port: SerialPort, request: JadeRpcRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(encode(request));
    port.write(encoded, (err) => {
      if (err) reject(new Error(`Failed to write to Jade: ${err.message}`));
      else resolve();
    });
  });
}

function readResponse(port: SerialPort, expectedId: string, timeoutMs: number): Promise<JadeRpcResponse> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let timer: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timer);
      port.removeAllListeners('data');
      port.removeAllListeners('error');
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Jade response timed out. Make sure to confirm on the device.'));
    }, timeoutMs);

    port.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      try {
        const combined = Buffer.concat(chunks);
        const response = decode(combined) as JadeRpcResponse;
        if (response.id === expectedId) {
          cleanup();
          resolve(response);
        }
      } catch {
        // Incomplete CBOR — wait for more data
      }
    });

    port.on('error', (err) => {
      cleanup();
      reject(new Error(`Jade serial error: ${err.message}`));
    });
  });
}

async function rpc(
  port: SerialPort,
  method: string,
  params?: Record<string, unknown>,
  timeoutMs = 10_000
): Promise<unknown> {
  const id = nextId();
  const request: JadeRpcRequest = { method, id };
  if (params) request.params = params;

  await sendRequest(port, request);
  const response = await readResponse(port, id, timeoutMs);

  if (response.error) {
    throw new Error(`Jade error (${response.error.code}): ${response.error.message}`);
  }

  return response.result;
}

export async function signPsbtWithJade(
  devicePath: string,
  psbtBase64: string,
  network: 'testnet' | 'mainnet'
): Promise<string> {
  const port = new SerialPort({
    path: devicePath,
    baudRate: JADE_BAUD_RATE,
    autoOpen: false,
  });

  // Open connection
  await new Promise<void>((resolve, reject) => {
    port.open((err) => {
      if (err) reject(new Error(`Cannot connect to Jade at ${devicePath}: ${err.message}`));
      else resolve();
    });
  });

  try {
    // Verify it's a Jade by requesting version info
    const versionInfo = await rpc(port, 'get_version_info');
    if (!versionInfo || typeof versionInfo !== 'object') {
      throw new Error('Device did not respond as a Blockstream Jade');
    }

    // Send PSBT for signing — user must confirm on device
    const signedPsbt = await rpc(
      port,
      'sign_psbt',
      {
        psbt: psbtBase64,
        network: network === 'testnet' ? 'testnet' : 'mainnet',
      },
      SIGN_TIMEOUT_MS
    );

    if (typeof signedPsbt !== 'string') {
      throw new Error('Jade returned unexpected response format');
    }

    return signedPsbt;
  } finally {
    // Always close the port
    await new Promise<void>((resolve) => {
      port.close(() => resolve());
    });
  }
}
