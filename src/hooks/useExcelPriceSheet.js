import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTS_JSON_URL = 'https://raw.githubusercontent.com/drwn44/DigiList/master/src/data/products.json';
const CACHE_KEY = 'arfigyelo_products';
const CACHE_DATE_KEY = 'arfigyelo_last_updated';
const CACHE_CHUNK_COUNT_KEY = 'arfigyelo_chunk_count';
const CHUNK_SIZE = 2000;

const cacheProducts = async (products) => {
    const today = new Date().toISOString().split('T')[0];
    const chunks = Math.ceil(products.length / CHUNK_SIZE);

    const oldChunkCount = await AsyncStorage.getItem(CACHE_CHUNK_COUNT_KEY);
    if (oldChunkCount) {
        for (let i = 0; i < parseInt(oldChunkCount); i++) {
            await AsyncStorage.removeItem(`${CACHE_KEY}_${i}`);
        }
    }

    for (let i = 0; i < chunks; i++) {
        const chunk = products.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await AsyncStorage.setItem(`${CACHE_KEY}_${i}`, JSON.stringify(chunk));
    }

    await AsyncStorage.setItem(CACHE_CHUNK_COUNT_KEY, String(chunks));
    await AsyncStorage.setItem(CACHE_DATE_KEY, today);
};

const loadCachedProducts = async () => {
    const chunkCount = await AsyncStorage.getItem(CACHE_CHUNK_COUNT_KEY);
    if (!chunkCount) return null;

    const chunks = await Promise.all(
        Array.from({ length: parseInt(chunkCount) }, (_, i) =>
            AsyncStorage.getItem(`${CACHE_KEY}_${i}`)
        )
    );

    if (chunks.some(c => c === null)) return null;
    return chunks.flatMap(c => JSON.parse(c));
};

export default function useExcelPriceSheet() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                const lastUpdated = await AsyncStorage.getItem(CACHE_DATE_KEY);
                const chunkCount = await AsyncStorage.getItem(CACHE_CHUNK_COUNT_KEY);
                if (lastUpdated === today && chunkCount) {
                    const cached = await loadCachedProducts();
                    if (cached) {
                        setProducts(cached);
                        setLoading(false);
                        return;
                    }
                }
                const response = await fetch(PRODUCTS_JSON_URL);
                const freshProducts = await response.json();
                try {
                    await cacheProducts(freshProducts);
                } catch (cacheError) {
                    console.error(cacheError);
                }
                setProducts(freshProducts);
            } catch (fetchError) {
                const cached = await loadCachedProducts();
                if (cached) {
                    setProducts(cached);
                } else {
                    setError('Nem sikerült betölteni az áradatokat. Ellenőrizd az internetkapcsolatot.');
                }
            } finally {
                setLoading(false);
            }
        };

        void fetchProducts();
    }, []);

    return { products, loading, error };
}