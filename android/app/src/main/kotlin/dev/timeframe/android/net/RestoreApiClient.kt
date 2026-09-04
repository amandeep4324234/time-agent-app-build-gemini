package dev.timeframe.android.net

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

@Serializable
data class PairingRedeemRequest(
    val code: String,
    val device_aid: String
)

@Serializable
data class PairingRedeemResponse(
    val aid: String,
    val tier: String,
    val plan: String? = null,
    val src: String? = null,
    val ref: String? = null,
    val skin: String? = null,
    val valid_until: String? = null
)

class RestoreApiClient(private val baseUrl: String = "https://timeframe.app") {
    private val json = Json { ignoreUnknownKeys = true }

    fun redeemCode(code: String, deviceAid: String): Result<PairingRedeemResponse> {
        return try {
            val url = URL("$baseUrl/api/pairing/redeem")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                doOutput = true
                connectTimeout = 10000
                readTimeout = 10000
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }

            val body = json.encodeToString(PairingRedeemRequest(code.trim().toUpperCase(), deviceAid))
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(body) }

            val responseCode = conn.responseCode
            if (responseCode == 200) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                val parsed = json.decodeFromString<PairingRedeemResponse>(responseText)
                Result.success(parsed)
            } else {
                val errorText = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: "HTTP $responseCode"
                Result.failure(Exception("Redeem failed ($responseCode): $errorText"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
