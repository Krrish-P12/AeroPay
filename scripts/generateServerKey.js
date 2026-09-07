import crypto from 'crypto';

/**
 * Generate an authentic Ed25519 KeyPair for the AeroPay Server.
 * Run with: node scripts/generateServerKey.js
 */
function generateServerKeys() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');

    const privateKeyBase64 = privateKey.export({
        type: 'pkcs8',
        format: 'der'
    }).toString('base64');

    const publicKeyBase64 = publicKey.export({
        type: 'spki',
        format: 'der'
    }).toString('base64');

    console.log("=================================================");
    console.log(" AeroPay Ed25519 Server Keys Generated ");
    console.log("=================================================");
    console.log("\nCopy this into your Vercel Environment Variables:\n");
    console.log(`SERVER_PRIVATE_KEY=${privateKeyBase64}`);
    console.log("\nPublic Key (For Merchant Verification):\n");
    console.log(`SERVER_PUBLIC_KEY=${publicKeyBase64}`);
    console.log("=================================================");
}

generateServerKeys();
