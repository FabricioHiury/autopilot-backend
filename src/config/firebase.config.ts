import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface FirebaseConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

function getConfigFromEnv(): FirebaseConfig | null {
  const {
    FIREBASE_TYPE,
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID,
    FIREBASE_AUTH_URI,
    FIREBASE_TOKEN_URI,
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    FIREBASE_CLIENT_X509_CERT_URL,
    FIREBASE_UNIVERSE_DOMAIN,
  } = process.env;

  if (
    FIREBASE_PROJECT_ID &&
    FIREBASE_PRIVATE_KEY &&
    FIREBASE_CLIENT_EMAIL
  ) {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    return {
      type: FIREBASE_TYPE || 'service_account',
      project_id: FIREBASE_PROJECT_ID,
      private_key_id: FIREBASE_PRIVATE_KEY_ID || '',
      private_key: privateKey,
      client_email: FIREBASE_CLIENT_EMAIL,
      client_id: FIREBASE_CLIENT_ID || '',
      auth_uri: FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url:
        FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
        'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        FIREBASE_CLIENT_X509_CERT_URL ||
        `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
          FIREBASE_CLIENT_EMAIL,
        )}`,
      universe_domain: FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
    };
  }

  return null;
}

function getConfigFromFile(): FirebaseConfig | null {
  try {
    const configPath = join(process.cwd(), 'src', 'config', 'firebase.json');
    if (!existsSync(configPath)) {
      return null;
    }
    const configFile = readFileSync(configPath, 'utf8');
    return JSON.parse(configFile) as FirebaseConfig;
  } catch {
    return null;
  }
}

export function getFirebaseConfig(): FirebaseConfig {
  const fromEnv = getConfigFromEnv();
  if (fromEnv) return fromEnv;

  const fromFile = getConfigFromFile();
  if (fromFile) return fromFile;

  console.error(
    'Erro ao carregar configuração do Firebase: nem variáveis de ambiente (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) nem o arquivo src/config/firebase.json foram encontrados.',
  );
  throw new Error('Não foi possível carregar a configuração do Firebase');
}