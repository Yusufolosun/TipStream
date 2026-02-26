/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_NETWORK: 'mainnet' | 'testnet' | 'devnet';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
