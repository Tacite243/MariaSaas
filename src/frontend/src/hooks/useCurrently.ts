import { useSelector } from "react-redux";
import { RootState } from "@renderer/app/store/store";

export const useCurrency = () => {
    // Si votre slice stocke le taux sous le nom "dailyRate" ou "exchangeRate", adaptez ici.
    const { currency, exchangeRate } = useSelector((state: RootState) => state.session);

    // Fallback de sécurité si le taux n'est pas encore chargé (évite les divisions/multiplications par 0)
    const rate = exchangeRate || 2500;

    // La base de données renvoie TOUJOURS des USD (amountInUSD)
    const formatPrice = (amountInUSD: number) => {
        if (currency === 'USD') {
            // Affichage direct (ajout du formatage américain)
            return {
                value: amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                symbol: '$'
            };
        } else {
            // Conversion en CDF (Multiplication)
            const valInCDF = amountInUSD * rate;
            return {
                value: Math.round(valInCDF).toLocaleString('fr-FR'), // Les CDF n'ont généralement pas de centimes
                symbol: 'FC'
            }
        }
    }
    return { currency, rate, formatPrice };
}