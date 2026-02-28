import { WebView } from 'react-native-webview';
import { View } from 'react-native';

export default function BarcodeDisplay({ value, format = 'CODE128', height = 120 }) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { 
                    width: 100%; 
                    height: 100%;
                    background: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                svg { width: 100% !important; }
            </style>
        </head>
        <body>
            <svg id="barcode"></svg>
            <script>
                JsBarcode("#barcode", "${value}", {
                    format: "${format}",
                    width: 2,
                    height: ${height},
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                    background: "#ffffff",
                    lineColor: "#000000",
                });
            </script>
        </body>
        </html>
    `;

    return (
        <View style={{ width: '100%', height: height + 60, backgroundColor: 'white' }}>
            <WebView
                source={{ html }}
                style={{ flex: 1, backgroundColor: 'white' }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                originWhitelist={['*']}
            />
        </View>
    );
}