import { AppConfig, UserSession } from '@stacks/connect';
import { STACKS_MAINNET } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export const network = STACKS_MAINNET;

export const appDetails = {
    name: 'TipStream',
    icon: window.location.origin + '/logo.png',
};

export async function authenticate() {
    console.log('authenticate() called');
    console.log('appDetails:', appDetails);
    console.log('userSession:', userSession);

    try {
        const { connect } = await import('@stacks/connect');

        await connect({
            appDetails,
            redirectTo: '/',
            onFinish: () => {
                console.log('Wallet connected successfully!');
                window.location.reload();
            },
            userSession,
        });
        console.log('connect() executed');
    } catch (error) {
        console.error('Error in authenticate():', error);
    }
}

export function getUserData() {
    return userSession.loadUserData();
}

export function disconnect() {
    userSession.signUserOut('/');
}
