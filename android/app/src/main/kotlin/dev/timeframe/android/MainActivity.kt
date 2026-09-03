package dev.timeframe.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.timeframe.android.ui.theme.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TimeframeTheme {
                MainAppScreen()
            }
        }
    }
}

enum class NavigationTab(val label: String) {
    Dashboard("Dashboard"),
    Week("Week"),
    Block("Block"),
    Settings("Settings")
}

@Composable
fun MainAppScreen() {
    var currentTab by remember { mutableStateOf(NavigationTab.Dashboard) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = SurfaceOverlay,
                tonalElevation = 0.dp,
                modifier = Modifier.height(64.dp)
            ) {
                NavigationTab.values().forEach { tab ->
                    val isSelected = currentTab == tab
                    val activeColor = if (tab == NavigationTab.Block) AccentCreature else TextPrimary
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentTab = tab },
                        icon = {},
                        label = {
                            Text(
                                text = tab.label,
                                fontSize = 12.sp,
                                color = if (isSelected) activeColor else TextTertiary
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = Color.Transparent
                        )
                    )
                }
            }
        },
        containerColor = SurfaceBase
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(SurfaceBase)
        ) {
            when (currentTab) {
                NavigationTab.Dashboard -> DashboardScreen()
                NavigationTab.Week -> WeekScreen()
                NavigationTab.Block -> BlockScreen()
                NavigationTab.Settings -> SettingsScreen()
            }
        }
    }
}

@Composable
fun DashboardScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Attention Ledger",
            color = TextPrimary,
            fontSize = 20.sp
        )
        Text(
            text = "Interval union across devices · Never moralizes",
            color = TextTertiary,
            fontSize = 12.sp
        )

        // Spec-ordered placeholder cards
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
            modifier = Modifier.fillMaxWidth().height(120.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Focus-set time", color = TextTertiary, fontSize = 11.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text("4h 22m", color = TextPrimary, fontSize = 28.sp)
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
            modifier = Modifier.fillMaxWidth().height(120.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Sink time", color = TextTertiary, fontSize = 11.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text("1h 08m", color = TextPrimary, fontSize = 28.sp)
            }
        }
    }
}

@Composable
fun WeekScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Week Review",
            color = TextPrimary,
            fontSize = 20.sp
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 5f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("phone this week", color = TextTertiary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("39.4h", color = TextPrimary, fontSize = 42.sp)
                    Text("focus-set time", color = TextSecondary, fontSize = 14.sp)
                }

                Text(
                    text = "Tracked 7 days · phone up 1/7 · computer up 7/7 · unclassified 4% · double-counted 0.24h",
                    color = TextTertiary,
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun BlockScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = "Live Focus Block",
            color = TextPrimary,
            fontSize = 20.sp
        )

        Box(
            modifier = Modifier
                .size(160.dp)
                .background(SurfaceRaised),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "00:25:00",
                color = AccentCreature,
                fontSize = 32.sp
            )
        }

        Button(
            onClick = {},
            colors = ButtonDefaults.buttonColors(containerColor = AccentCreature)
        ) {
            Text("Start block", color = SurfaceBase)
        }
    }
}

@Composable
fun SettingsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Settings",
            color = TextPrimary,
            fontSize = 20.sp
        )

        Text(
            text = "Death floor — when a killer ends a block",
            color = TextSecondary,
            fontSize = 14.sp
        )

        Text(
            text = "All ledger metrics are free and local-first.",
            color = TextTertiary,
            fontSize = 12.sp
        )
    }
}
