const https = require("https");
const fs = require("fs");
const API_BASE = "https://api.riftcodex.com/cards";

// Fonction fetch simple
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject("JSON parse error: " + err);
                }
            });
        }).on("error", (err) => reject("HTTP error: " + err));
    });
}

// Fonction principale
async function fetchAllCards() {
    console.log("🔄 Récupération des cartes Riftbound...");
    let page = 1;
    let cards = {};
    let totalPages = 1;

    do {
        const url = `${API_BASE}?page=${page}&size=100`;
        let data;
        try {
            data = await fetchJson(url);
        } catch (err) {
            console.error("Erreur API :", err);
            break;
        }

        data.items.forEach((c) => {
            const cardId = c.public_code ? c.public_code.split("/")[0] : c.id;
            const cardType = c.classification?.type || "Unknown"

            cards[cardId] = {
                id: cardId,
                face: {
                    front: {
                        name: c.name,
                        type: cardType,
                        cost: c.attributes?.energy || 0,
                        image: c.media?.image_url || "",
                        isHorizontal: cardType === "Battlefield"
                    }
                },
                name: c.name,
                type: cardType,
                cost: c.attributes?.energy || 0,
                Domain: c.classification?.domain || [],
                rarity: c.classification?.rarity || "Unknown",
                Set: [c.set?.label || "Unknown"],
                isToken: c.classification?.superType === "Token"
            };
        });

        totalPages = data.pages;
        console.log(`Page ${page}/${totalPages} traitée...`);
        page++;
    } while (page <= totalPages);

    // Sauvegarde dans un fichier
    fs.writeFileSync("RiftboundCards.json", JSON.stringify(cards, null, 2), "utf8");
    console.log(`✔ ${Object.keys(cards).length} cartes sauvegardées dans RiftboundCards.json`);
}

// Exécution
fetchAllCards();
