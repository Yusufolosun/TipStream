import { AppConfig, UserSession } from '@stacks/connect';
import { STACKS_MAINNET, STACKS_TESTNET, STACKS_DEVNET } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

const networks = {
    mainnet: STACKS_MAINNET,
    testnet: STACKS_TESTNET,
    devnet: STACKS_DEVNET,
};

const networkName = import.meta.env.VITE_NETWORK || 'mainnet';
export const network = networks[networkName] || STACKS_MAINNET;

export const appDetails = {
    name: 'TipStream',
    icon: window.location.origin + '/logo.png',
};

export async function authenticate() {
    try {
        const { connect } = await import('@stacks/connect');

        await connect({
            appDetails,
            redirectTo: '/',
            onFinish: () => {
                window.location.reload();
            },
            userSession,
        });
    } catch (error) {
        console.error('Failed to connect wallet:', error.message || error);
    }
}

export function getUserData() {
    return userSession.loadUserData();
}

export function disconnect() {
    userSession.signUserOut('/');
}
