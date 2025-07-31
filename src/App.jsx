import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { BrowserQRCodeReader } from "@zxing/browser";

// --- Configurazione Supabase ---
const supabaseUrl = "https://jtxghmwqskpwzmfrsyng.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eGdobXdxc2twd3ptZnJzeW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTA5NDgsImV4cCI6MjA2OTM2Njk0OH0.pjbLXTq6WFfP-tjkffoVfaLT1jmUXpa9IaolKE_PNOw";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Componente Messaggio di Notifica ---
function Notification({ message, type, onClose }) {
    if (!message) return null;

    const baseStyle = "p-4 rounded-md shadow-lg text-white mb-4";
    const typeStyle = type === "error" ? "bg-red-500" : "bg-green-500";

    return (
        <div className={`${baseStyle} ${typeStyle}`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">
                X
            </button>
        </div>
    );
}

// --- Schermata di Autenticazione ---
function AuthScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "" });

    const clearNotification = () => setNotification({ message: "", type: "" });

    async function handleLogin() {
        setLoading(true);
        clearNotification();
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setNotification({ message: error.message, type: "error" });
        }
        setLoading(false);
    }

    async function handleSignUp() {
        setLoading(true);
        clearNotification();
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            setNotification({ message: error.message, type: "error" });
        } else {
            setNotification({
                message:
                    "Registrazione completata! Controlla la tua email per la conferma.",
                type: "success",
            });
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 relative">
            <Notification
                message={notification.message}
                type={notification.type}
                onClose={clearNotification}
            />
            <h1 className="text-5xl font-bold text-yellow-400 mb-8 font-mono">
                Arcade Cafè
            </h1>
            <div className="w-full max-w-sm space-y-4">
                <input
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-yellow-400 rounded-lg text-white focus:outline-none focus:border-yellow-300"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                />
                <input
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-yellow-400 rounded-lg text-white focus:outline-none focus:border-yellow-300"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                />
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 disabled:bg-gray-500"
                >
                    {loading ? "Accesso..." : "Accedi"}
                </button>
                <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="w-full py-3 bg-transparent border-2 border-yellow-400 text-yellow-400 font-bold rounded-lg hover:bg-yellow-400 hover:text-gray-900 disabled:bg-gray-500"
                >
                    {loading ? "Registrazione..." : "Registrati"}
                </button>
            </div>
            <p className="absolute bottom-2 right-2 text-xs text-gray-600">
                V. 1.4
            </p>
        </div>
    );
}

// --- Componente Scanner ---
function ScannerComponent({ onScan, onCancel }) {
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const [status, setStatus] = useState("Inizializzazione...");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!codeReaderRef.current) {
            codeReaderRef.current = new BrowserQRCodeReader();
        }

        const codeReader = codeReaderRef.current;

        const startScan = async () => {
            try {
                setStatus("Ricerca fotocamere...");
                const videoInputDevices =
                    await BrowserQRCodeReader.listVideoInputDevices();
                if (videoInputDevices.length === 0) {
                    throw new Error("Nessuna fotocamera trovata.");
                }

                let selectedDeviceId = videoInputDevices[0].deviceId;
                const rearCamera = videoInputDevices.find((device) =>
                    device.label.toLowerCase().includes("back"),
                );
                if (rearCamera) {
                    selectedDeviceId = rearCamera.deviceId;
                }

                setStatus("Avvio scansione...");

                await codeReader.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, err, controls) => {
                        if (result) {
                            controls.stop();
                            onScan(result.getText());
                        }
                    },
                );

                setStatus("Scansione attiva");
            } catch (err) {
                console.error("ERRORE SCANNER:", err);
                setError(`Errore fotocamera: ${err.name} - ${err.message}`);
                setStatus("Errore");
            }
        };

        startScan();

        return () => {
            if (codeReader) {
                codeReader.reset();
            }
        };
    }, [onScan, onCancel]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <h2 className="text-white text-2xl mb-4">Inquadra il QR Code</h2>
            <div className="w-full max-w-sm bg-gray-800 flex items-center justify-center h-64 rounded-lg">
                {status === "Errore" ? (
                    <p className="text-red-500 text-center px-4 break-words">
                        {error}
                    </p>
                ) : (
                    <video
                        ref={videoRef}
                        className={`w-full rounded-lg ${status === "Scansione attiva" ? "block" : "hidden"}`}
                    />
                )}
                {status !== "Scansione attiva" && status !== "Errore" && (
                    <p className="text-white">{status}</p>
                )}
            </div>
            <button
                onClick={() => onCancel()}
                className="mt-4 px-6 py-2 bg-red-500 text-white font-bold rounded-lg"
            >
                Annulla
            </button>
        </div>
    );
}

// --- Schermata Principale (Dashboard) ---
function MainScreen({ session }) {
    const [associato, setAssociato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [gameSession, setGameSession] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showScanner, setShowScanner] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "" });

    const timerRef = useRef(null);
    const tokenConsumptionRef = useRef(null);

    const clearNotification = () => setNotification({ message: "", type: "" });

    useEffect(() => {
        if (session) {
            fetchAssociatoData();
        }
    }, [session]);

    useEffect(() => {
        if (gameSession) {
            timerRef.current = setInterval(() => {
                setElapsedTime(
                    Math.floor(
                        (Date.now() -
                            new Date(gameSession.start_time).getTime()) /
                            1000,
                    ),
                );
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setElapsedTime(0);
        }
        return () => clearInterval(timerRef.current);
    }, [gameSession]);

    useEffect(() => {
        if (gameSession) {
            tokenConsumptionRef.current = setInterval(consumeToken, 300000); // 5 minuti
        } else {
            clearInterval(tokenConsumptionRef.current);
        }
        return () => clearInterval(tokenConsumptionRef.current);
    }, [gameSession]);

    useEffect(() => {
        if (!session) return;
        const associatoChannel = supabase
            .channel("associati-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "associati",
                    filter: `id=eq.${session.user.id}`,
                },
                (payload) => {
                    setAssociato(payload.new);
                },
            )
            .subscribe();
        return () => supabase.removeChannel(associatoChannel);
    }, [session]);

    const fetchAssociatoData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("associati")
                .select("*")
                .eq("id", session.user.id)
                .single();
            if (error) throw error;
            setAssociato(data);
            await checkActiveSession(data.id);
        } catch (error) {
            setNotification({
                message: "Errore nel caricamento dei dati.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const checkActiveSession = async (associatoId) => {
        const { data, error } = await supabase
            .from("sessioni_gioco")
            .select("*, cabinati(*)")
            .eq("associato_id", associatoId)
            .eq("is_active", true)
            .single();
        if (data) {
            setGameSession(data);
        } else if (error && error.code !== "PGRST116") {
            setNotification({
                message: "Errore nel controllo della sessione di gioco.",
                type: "error",
            });
        }
    };

    const consumeToken = async () => {
        const { data: currentAssociato } = await supabase
            .from("associati")
            .select("tokens")
            .eq("id", session.user.id)
            .single();
        if (!currentAssociato || currentAssociato.tokens <= 0) {
            setNotification({
                message: "Token esauriti! Un gestore verrà avvisato.",
                type: "error",
            });
            clearInterval(tokenConsumptionRef.current);
            return;
        }
        const { error } = await supabase.rpc("consuma_token", {
            p_associato_id: session.user.id,
        });
        if (error) {
            setNotification({
                message: "Errore durante il consumo del token.",
                type: "error",
            });
        } else if (currentAssociato.tokens - 1 <= 0) {
            setNotification({
                message: "Ultimo token utilizzato!",
                type: "error",
            });
        }
    };

    const handleStopGame = async () => {
        if (!gameSession) return;
        try {
            await supabase
                .from("sessioni_gioco")
                .update({
                    end_time: new Date().toISOString(),
                    is_active: false,
                })
                .eq("id", gameSession.id);
            await supabase
                .from("cabinati")
                .update({ stato: "libero" })
                .eq("id", gameSession.cabinato_id);
            await supabase
                .from("associati")
                .update({ isPlaying: false })
                .eq("id", associato.id);
            setNotification({
                message: "Sessione di gioco terminata.",
                type: "success",
            });
            setGameSession(null);
            fetchAssociatoData();
        } catch (error) {
            setNotification({
                message: "Errore nella terminazione della sessione.",
                type: "error",
            });
        }
    };

    const handleBarCodeScanned = async (decodedText) => {
        setShowScanner(false);
        setIsProcessingScan(true);

        const cabinatoId = parseInt(decodedText, 10);
        if (isNaN(cabinatoId)) {
            setNotification({ message: "QR non valido.", type: "error" });
            setIsProcessingScan(false);
            return;
        }
        try {
            if (!associato) {
                throw new Error("Dati utente non ancora caricati. Riprova.");
            }
            if (!associato.abbonamento_attivo)
                throw new Error("Abbonamento non attivo.");
            if (associato.tokens <= 0) throw new Error("Token esauriti.");
            if (associato.isPlaying) throw new Error("Stai già giocando.");
            const { data: cabinato, error: cabinatoError } = await supabase
                .from("cabinati")
                .select("*")
                .eq("id", cabinatoId)
                .single();
            if (cabinatoError) throw new Error("Cabinato non trovato.");
            if (cabinato.stato !== "libero")
                throw new Error(
                    `Il cabinato "${cabinato.nome_gioco}" è occupato.`,
                );
            const { error: rpcError } = await supabase.rpc("avvia_gioco", {
                p_associato_id: associato.id,
                p_cabinato_id: cabinatoId,
            });
            if (rpcError) throw rpcError;
            setNotification({
                message: `Buon divertimento con ${cabinato.nome_gioco}!`,
                type: "success",
            });
            await fetchAssociatoData();
        } catch (error) {
            setNotification({
                message: `Prenotazione Fallita: ${error.message}`,
                type: "error",
            });
        } finally {
            setIsProcessingScan(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setNotification({
                message: `Logout fallito: ${error.message}`,
                type: "error",
            });
        }
    };

    const handleCancelScan = (errorMessage) => {
        if (errorMessage) {
            setNotification({ message: errorMessage, type: "error" });
        }
        setShowScanner(false);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((seconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                Caricamento...
            </div>
        );
    }

    if (isProcessingScan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                Processando scansione...
            </div>
        );
    }

    if (showScanner) {
        return (
            <ScannerComponent
                onScan={handleBarCodeScanned}
                onCancel={handleCancelScan}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center relative">
            <Notification
                message={notification.message}
                type={notification.type}
                onClose={clearNotification}
            />
            {gameSession ? (
                <div className="w-full max-w-md text-center flex flex-col items-center justify-center flex-grow">
                    <p className="text-xl">Stai giocando a:</p>
                    <h2 className="text-4xl font-bold text-yellow-400 my-2">
                        {gameSession.cabinati.nome_gioco}
                    </h2>
                    <p className="text-8xl font-mono my-6">
                        {formatTime(elapsedTime)}
                    </p>
                    <div className="text-2xl mb-8">
                        <span>Token Residui: </span>
                        <span className="font-bold text-yellow-400">
                            {associato?.tokens}
                        </span>
                    </div>
                    <button
                        onClick={handleStopGame}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500"
                    >
                        Termina Gioco
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-md text-center flex flex-col items-center justify-center flex-grow">
                    <h2 className="text-3xl mb-2">
                        Ciao, {associato?.nome || session.user.email}!
                    </h2>
                    <div className="bg-gray-800 p-6 rounded-lg my-6 w-full">
                        <p className="text-xl mb-2">
                            Tokens:{" "}
                            <span className="font-bold text-yellow-400">
                                {associato?.tokens}
                            </span>
                        </p>
                        <p className="text-xl mb-2">
                            Abbonamento:{" "}
                            <span
                                className={
                                    associato?.abbonamento_attivo
                                        ? "text-green-400"
                                        : "text-red-400"
                                }
                            >
                                {associato?.abbonamento_attivo
                                    ? "Attivo"
                                    : "Non Attivo"}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowScanner(true)}
                        className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg text-xl hover:bg-yellow-300"
                    >
                        Scansiona per Giocare
                    </button>
                </div>
            )}
            <button
                onClick={handleLogout}
                className="mt-auto text-yellow-400 hover:text-white"
            >
                Logout
            </button>
            <p className="absolute bottom-2 right-2 text-xs text-gray-600">
                V. 1.4
            </p>
        </div>
    );
}

// --- Componente Principale App ---
export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                Caricamento...
            </div>
        );
    }

    if (!session) {
        return <AuthScreen />;
    } else {
        return <MainScreen key={session.user.id} session={session} />;
    }
}
