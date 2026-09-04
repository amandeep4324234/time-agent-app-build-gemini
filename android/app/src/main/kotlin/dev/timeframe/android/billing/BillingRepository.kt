package dev.timeframe.android.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class BillingRepository(
    private val context: Context,
    private val entitlementStore: EntitlementStore,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : PurchasesUpdatedListener {

    private val _purchasesState = MutableStateFlow<List<Purchase>>(emptyList())
    val purchasesState: StateFlow<List<Purchase>> = _purchasesState

    private var billingClient: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    fun startConnection() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryPurchases()
                }
            }

            override fun onBillingServiceDisconnected() {
                // Will retry on next user action
            }
        })
    }

    fun queryPurchases() {
        if (!billingClient.isReady) return

        // 1. Query active subscriptions
        val subParams = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        billingClient.queryPurchasesAsync(subParams) { result, purchases ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                handlePurchases(purchases, isSubscription = true)
            }
        }

        // 2. Query one-time purchases (classic skin)
        val inappParams = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()
        billingClient.queryPurchasesAsync(inappParams) { result, purchases ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                handlePurchases(purchases, isSubscription = false)
            }
        }
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            handlePurchases(purchases, isSubscription = false)
        }
    }

    private fun handlePurchases(purchases: List<Purchase>, isSubscription: Boolean) {
        scope.launch {
            _purchasesState.value = purchases
            for (purchase in purchases) {
                if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                    // Acknowledge if needed
                    if (!purchase.isAcknowledged) {
                        val ackParams = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchase.purchaseToken)
                            .build()
                        billingClient.acknowledgePurchase(ackParams) { /* acknowledged */ }
                    }

                    val isSkin = purchase.products.contains("tf.skin.classic")
                    val plan = if (isSkin) "skin" else "monthly"
                    val skin = if (isSkin) "classic" else null

                    entitlementStore.saveEntitlement(
                        EntitlementRecord(
                            aid = entitlementStore.getEntitlement().aid,
                            tier = "pro",
                            plan = plan,
                            src = "play",
                            ref = purchase.orderId ?: purchase.purchaseToken,
                            skin = skin,
                            valid_until = null
                        )
                    )
                }
            }
        }
    }

    fun launchBillingFlow(activity: Activity, productDetails: ProductDetails, offerToken: String) {
        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()
        )
        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()
        billingClient.launchBillingFlow(activity, flowParams)
    }
}
