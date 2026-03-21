export default {
    expo: {
        name: "DigiList",
        slug: "digilist",
        version: "1.0.1",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        scheme: "digilist",
        plugins: [
            "expo-camera",
            "@react-native-google-signin/google-signin"
        ],
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#141414"
        },
        ios: {
            supportsTablet: true
        },
        android: {
            package: "com.drwn.digilist",
            googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            eas: {
                projectId: "fa1a3557-b16f-4e3c-bce9-1ee14fbab144"
            },
            firebaseApiKey: process.env.FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.FIREBASE_APP_ID,
            groqApiKey: process.env.GROQ_API_KEY,
            googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
        }
    }
};