package dev.timeframe.android.billing

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.KeyStore
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

@Serializable
data class EntitlementRecord(
    val aid: String,
    val tier: String, // "free" | "pro"
    val plan: String? = null, // "monthly" | "annual" | "skin"
    val src: String? = null, // "play" | "razorpay"
    val ref: String? = null,
    val skin: String? = null, // "classic"
    val valid_until: String? = null
)

class EntitlementStore(private val context: Context) {
    private val prefs = context.getSharedPreferences("timeframe_ent_store", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val keyAlias = "timeframe_ent_key"
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    init {
        ensureKey()
    }

    private fun ensureKey() {
        if (!keyStore.containsAlias(keyAlias)) {
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            val spec = KeyGenParameterSpec.Builder(
                keyAlias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
            keyGenerator.init(spec)
            keyGenerator.generateKey()
        }
    }

    private fun getSecretKey(): SecretKey {
        return keyStore.getKey(keyAlias, null) as SecretKey
    }

    fun getEntitlement(): EntitlementRecord {
        val encrypted = prefs.getString("tf_ent_android", null) ?: return defaultFree()
        return try {
            val raw = decrypt(encrypted)
            json.decodeFromString<EntitlementRecord>(raw)
        } catch (_: Exception) {
            defaultFree()
        }
    }

    fun saveEntitlement(record: EntitlementRecord) {
        val current = getEntitlement()
        val merged = mergeUnion(current, record)
        val jsonStr = json.encodeToString(merged)
        val encrypted = encrypt(jsonStr)
        prefs.edit().putString("tf_ent_android", encrypted).apply()
    }

    private fun mergeUnion(a: EntitlementRecord, b: EntitlementRecord): EntitlementRecord {
        val isPro = a.tier == "pro" || b.tier == "pro"
        val tier = if (isPro) "pro" else "free"
        val skin = a.skin ?: b.skin
        val plan = if (a.tier == "pro") a.plan ?: b.plan else b.plan
        val src = if (a.tier == "pro") a.src ?: b.src else b.src
        val ref = if (a.tier == "pro") a.ref ?: b.ref else b.ref

        // Pick max valid_until (or null if skin forever)
        val validUntil = if (skin != null) null else {
            val validA = a.valid_until
            val validB = b.valid_until
            when {
                validA == null && validB != null -> validB
                validB == null && validA != null -> validA
                validA != null && validB != null -> if (validA > validB) validA else validB
                else -> null
            }
        }

        return EntitlementRecord(
            aid = a.aid.ifEmpty { b.aid },
            tier = tier,
            plan = plan,
            src = src,
            ref = ref,
            skin = skin,
            valid_until = validUntil
        )
    }

    private fun defaultFree(): EntitlementRecord {
        return EntitlementRecord(
            aid = prefs.getString("tf_aid", null) ?: run {
                val newAid = java.util.UUID.randomUUID().toString()
                prefs.edit().putString("tf_aid", newAid).apply()
                newAid
            },
            tier = "free"
        )
    }

    private fun encrypt(plaintext: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
        val iv = cipher.iv
        val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        val combined = ByteArray(iv.size + ciphertext.size)
        System.arraycopy(iv, 0, combined, 0, iv.size)
        System.arraycopy(ciphertext, 0, combined, iv.size, ciphertext.size)
        return Base64.getEncoder().encodeToString(combined)
    }

    private fun decrypt(encryptedBase64: String): String {
        val combined = Base64.getDecoder().decode(encryptedBase64)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, combined, 0, 12)
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), spec)
        val plaintext = cipher.doFinal(combined, 12, combined.size - 12)
        return String(plaintext, Charsets.UTF_8)
    }
}
