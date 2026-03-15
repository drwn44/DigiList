export const getAuthErrorMessage = (code) => {
    switch (code) {
        case 'auth/invalid-email': return 'Érvénytelen email cím';
        case 'auth/user-not-found': return 'Nem található ilyen felhasználó';
        case 'auth/wrong-password': return 'Hibás jelszó';
        case 'auth/invalid-credential': return 'Hibás email vagy jelszó';
        case 'auth/too-many-requests': return 'Túl sok sikertelen kísérlet, próbáld később';
        case 'auth/email-already-in-use': return 'Ez az email cím már foglalt';
        case 'auth/weak-password': return 'A jelszó legalább 6 karakter legyen';
        case 'auth/password-does-not-meet-requirements': return 'A jelszónak tartalmaznia kell nagy- és kisbetűt, számot és speciális karaktert';
        default: return 'Hiba történt, próbáld újra';
    }
};