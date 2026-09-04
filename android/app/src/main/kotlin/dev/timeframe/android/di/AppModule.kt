package dev.timeframe.android.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import dev.timeframe.android.billing.BillingRepository
import dev.timeframe.android.billing.EntitlementStore
import dev.timeframe.android.net.RestoreApiClient
import dev.timeframe.collector.db.*
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): TimeframeDatabase {
        return Room.databaseBuilder(
            context,
            TimeframeDatabase::class.java,
            "timeframe.db"
        ).build()
    }

    @Provides
    fun provideSessionDao(db: TimeframeDatabase): SessionDao = db.sessionDao()

    @Provides
    fun providePinDao(db: TimeframeDatabase): PinDao = db.pinDao()

    @Provides
    fun provideUsageEventDao(db: TimeframeDatabase): UsageEventDao = db.usageEventDao()

    @Provides
    fun provideFocusBlockDao(db: TimeframeDatabase): FocusBlockDao = db.focusBlockDao()

    @Provides
    fun provideCollectorHealthDao(db: TimeframeDatabase): CollectorHealthDao = db.collectorHealthDao()

    @Provides
    @Singleton
    fun provideEntitlementStore(@ApplicationContext context: Context): EntitlementStore {
        return EntitlementStore(context)
    }

    @Provides
    @Singleton
    fun provideBillingRepository(
        @ApplicationContext context: Context,
        entitlementStore: EntitlementStore
    ): BillingRepository {
        return BillingRepository(context, entitlementStore)
    }

    @Provides
    @Singleton
    fun provideRestoreApiClient(): RestoreApiClient {
        return RestoreApiClient()
    }
}
