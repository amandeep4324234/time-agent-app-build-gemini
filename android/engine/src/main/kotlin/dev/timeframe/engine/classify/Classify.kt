package dev.timeframe.engine.classify

import dev.timeframe.engine.ports.SessionRow

object Classify {
    val SEED_WORK = listOf(
        "Grok", "ChatGPT", "GitHub", "localhost", "AWS", "Lovable", "gemini",
        "aistudio", "qwen", "agentrouter", "vercel", "apify", "21st.dev"
    )

    val SEED_KILLERS = listOf(
        "Instagram", "YouTube", "Discord", "Reddit"
    )

    fun isSensitive(label: String, seedMap: Map<String, String>): Boolean {
        if (label == "screening.mhanational.org" || label == "heartitout.in") return true
        return seedMap[label] == "private"
    }

    fun isChessOrGames(label: String): Boolean {
        val l = label.lowercase()
        return l.contains("chess") || l.contains("lichess") || l == "games"
    }

    fun classify(
        session: SessionRow,
        userPins: Map<String, String> = emptyMap(),
        userOverrides: Map<String, String> = emptyMap(),
        seedMap: Map<String, String> = emptyMap()
    ): String {
        val label = session.label

        // Sensitive fence is absolute
        if (isSensitive(label, seedMap)) {
            return "private"
        }

        // User overrides
        userOverrides[label]?.let {
            if (it in listOf("work", "sink", "games", "other-known")) return it
        }

        // User pins
        userPins[label]?.let {
            return it
        }

        // Phone Chrome -> unknown (unclassified)
        if (session.device == "phone" && (label == "Chrome" || label.lowercase().contains("chrome"))) {
            return "unclassified"
        }

        // Work seeds
        for (w in SEED_WORK) {
            if (label.equals(w, ignoreCase = true) || label.contains(w, ignoreCase = true)) {
                return "work"
            }
        }

        // Killer seeds
        for (k in SEED_KILLERS) {
            if (label.equals(k, ignoreCase = true) || label.contains(k, ignoreCase = true)) {
                return "sink"
            }
        }

        // Chess/games
        if (isChessOrGames(label)) {
            return "games"
        }

        // Seed map
        seedMap[label]?.let {
            return it
        }

        return "unclassified"
    }
}
