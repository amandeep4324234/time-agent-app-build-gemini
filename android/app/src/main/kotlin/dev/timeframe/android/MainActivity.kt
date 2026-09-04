package dev.timeframe.android

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import dev.timeframe.android.billing.EntitlementStore
import dev.timeframe.android.ui.WeekCardRenderer
import dev.timeframe.android.ui.theme.*
import dev.timeframe.engine.compute.Week

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
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
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
    val context = LocalContext.current
    var hasUsageAccess by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Tracker-off banner (top of dashboard per Android spec C3)
        if (!hasUsageAccess) {
            item {
                Surface(
                    color = SurfaceOverlay,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .border(1.dp, StateWarn, RoundedCornerShape(12.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Phone tracker off since today",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Turn on",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            modifier = Modifier.clickable {
                                context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                            }
                        )
                    }
                }
            }
        }

        // Habitat hero (200dp home hero per C5)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Creature Zone
                    Box(
                        modifier = Modifier
                            .size(96.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceBase)
                            .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .border(2.dp, AccentCreature, CircleShape)
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Current streak", color = TextTertiary, fontSize = 11.sp)
                        Text("7 days", color = TextPrimary, fontSize = 24.sp, fontFamily = FontFamily.Monospace)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Last block: completed", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }
        }

        // Spec order: Card 1 - Focus-set time
        item {
            MetricCard(
                label = "Focus-set time",
                value = "4h 22m",
                delta = "▲ 0.4h"
            )
        }

        // Spec order: Card 2 - Sink
        item {
            MetricCard(
                label = "Sink",
                value = "1h 08m",
                delta = "▼ 0.2h"
            )
        }

        // Spec order: Card 3 - Blocks >= 15 min & Longest
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Blocks ≥15 min", color = TextTertiary, fontSize = 11.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Text("4", color = TextPrimary, fontSize = 28.sp, fontFamily = FontFamily.Monospace)
                        Column(horizontalAlignment = Alignment.End) {
                            Text("longest", color = TextTertiary, fontSize = 11.sp)
                            Text("45 min", color = TextPrimary, fontSize = 18.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }

        // Spec order: Card 4 - Share of tracked time (Mix ring)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Share of tracked time", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        Surface(
                            color = Color.Transparent,
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle),
                            shape = CircleShape
                        ) {
                            Text(
                                "19% unclassified",
                                color = TextTertiary,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text("% of tracked time", color = TextTertiary, fontSize = 12.sp)

                    // Wedge legend rows
                    MixRow("Work", "62%", CatFocus)
                    MixRow("Sink", "16%", CatSink)
                    MixRow("Games", "3%", CatGames)
                    MixRow("Unclassified", "19%", CatUnclassified)
                }
            }
        }

        // Spec order: Card 5 - Top 5 sinks by hours
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Top 5 sinks by hours", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    SinkRow("Instagram", "45m", "×8", CatSink)
                    SinkRow("YouTube", "18m", "×3", CatSink)
                    SinkRow("Reddit", "5m", "×2", CatSink)
                }
            }
        }

        // Spec order: Card 6 - Hours by source
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Hours by source", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    SourceRow("Phone", "5h 02m")
                    SourceRow("Computer", "off")
                    Text("last write: phone 2h ago · computer never", color = TextTertiary, fontSize = 11.sp)
                }
            }
        }

        // Spec order: Card 7 - Heatmap
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("When tracked time happened", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    Row(
                        modifier = Modifier.fillMaxWidth().height(24.dp),
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        repeat(24) { i ->
                            val alpha = if (i in 9..18) 0.8f else if (i in 19..22) 0.4f else 0.05f
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .background(TextPrimary.copy(alpha = alpha))
                            )
                        }
                    }
                    Text("00:00 – 23:00 local time", color = TextTertiary, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun MetricCard(label: String, value: String, delta: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, color = TextTertiary, fontSize = 11.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(value, color = TextPrimary, fontSize = 28.sp, fontFamily = FontFamily.Monospace)
                Text(delta, color = TextTertiary, fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun MixRow(name: String, value: String, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(10.dp).background(color, RoundedCornerShape(2.dp)))
            Text(name, color = TextSecondary, fontSize = 13.sp)
        }
        Text(value, color = TextPrimary, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
    }
}

@Composable
fun SinkRow(name: String, duration: String, count: String, dotColor: Color) {
    Row(
        modifier = Modifier.fillMaxWidth().height(40.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(8.dp).background(dotColor, CircleShape))
            Text(name, color = TextSecondary, fontSize = 13.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(duration, color = TextPrimary, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
            Text(count, color = TextTertiary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
        }
    }
}

@Composable
fun SourceRow(device: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(device, color = TextSecondary, fontSize = 13.sp)
        Text(value, color = if (value == "off") TextTertiary else TextPrimary, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
    }
}

@Composable
fun WeekScreen() {
    val context = LocalContext.current
    var selectedDevice by remember { mutableStateOf("phone this week") }

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
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )

        // Device selector segmented control
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(SurfaceOverlay, CircleShape)
                .border(1.dp, BorderSubtle, CircleShape)
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            listOf("phone this week", "laptop this week").forEach { opt ->
                val isSel = selectedDevice == opt
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(CircleShape)
                        .background(if (isSel) FillSelected else Color.Transparent)
                        .clickable { selectedDevice = opt },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        opt,
                        color = if (isSel) TextPrimary else TextSecondary,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Preview Card (1080x1350 aspect ratio)
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 5f)
                .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(selectedDevice, color = TextTertiary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("39.37h", color = TextPrimary, fontSize = 42.sp, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold)
                    Text("focus-set time", color = TextSecondary, fontSize = 14.sp)

                    Spacer(modifier = Modifier.height(20.dp))
                    WeekStatRow("Focus-set time", "39h 22m")
                    WeekStatRow("Sink", "7h 02m")
                    WeekStatRow("Blocks ≥15 min", "10")
                    WeekStatRow("Longest", "50 min")
                }

                Text(
                    text = "Tracked 7 days · phone up 1/7 · computer up 7/7 · unclassified 19% · double-counted 0.24h",
                    color = TextTertiary,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Text("Private apps stay off this card.", color = TextTertiary, fontSize = 12.sp)

        Button(
            onClick = {
                val cardModel = Week.CardModel(
                    weekStart = "2026-08-31",
                    label = selectedDevice,
                    hero = "39.37h",
                    stats = listOf(
                        Week.StatRow("Focus-set time", "39h 22m"),
                        Week.StatRow("Sink", "7h 02m"),
                        Week.StatRow("Blocks ≥15 min", "10"),
                        Week.StatRow("Longest", "50 min")
                    ),
                    footer = "Tracked 7 days · phone up 1/7 · computer up 7/7 · unclassified 19% · double-counted 0.24h",
                    watermark = false
                )
                val bitmap = WeekCardRenderer.renderWeekCard(context, cardModel, isPro = true)
                val file = WeekCardRenderer.saveCardToFile(context, bitmap)
                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "image/png"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                context.startActivity(Intent.createChooser(sendIntent, "Share Week Card"))
            },
            colors = ButtonDefaults.buttonColors(containerColor = SurfaceOverlay),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Text("Share card", color = TextPrimary, fontSize = 14.sp)
        }
    }
}

@Composable
fun WeekStatRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = TextSecondary, fontSize = 13.sp)
        Text(value, color = TextPrimary, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
    }
}

@Composable
fun BlockScreen() {
    var isRunning by remember { mutableStateOf(false) }
    var selectedTarget by remember { mutableStateOf(25) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Live Focus Block", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)

            // Creature Zone (200x200px per C7)
            Box(
                modifier = Modifier
                    .size(180.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceRaised)
                    .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .border(2.dp, AccentCreature, CircleShape)
                )
            }

            Text(
                text = if (isRunning) "14:22" else "00:00",
                color = AccentCreature,
                fontSize = 48.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "focus-set time · live",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Target selector segmented control: 25 / 15 / 45 / open-ended
            if (!isRunning) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .background(SurfaceOverlay, CircleShape)
                        .border(1.dp, BorderSubtle, CircleShape)
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf(15 to "15m", 25 to "25m", 45 to "45m", 0 to "Open").forEach { (target, label) ->
                        val isSel = selectedTarget == target
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(CircleShape)
                                .background(if (isSel) FillSelected else Color.Transparent)
                                .clickable { selectedTarget = target },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(label, color = if (isSel) TextPrimary else TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }

            Button(
                onClick = { isRunning = !isRunning },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isRunning) SurfaceRaised else AccentCreature
                ),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text(
                    text = if (isRunning) "End block" else "Start block",
                    color = if (isRunning) TextPrimary else SurfaceBase,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    var deathFloor by remember { mutableStateOf(5) }
    var showWipeDialog by remember { mutableStateOf(false) }

    val exportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json")
    ) { _ -> }

    val importLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { _ -> }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("Settings", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)

        // Death Floor Setting
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Death floor — when a killer ends a block", color = TextSecondary, fontSize = 13.sp)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
                    .background(SurfaceOverlay, CircleShape)
                    .border(1.dp, BorderSubtle, CircleShape)
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf(3 to "3s", 5 to "5s", 10 to "10s").forEach { (floor, label) ->
                    val isSel = deathFloor == floor
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clip(CircleShape)
                            .background(if (isSel) FillSelected else Color.Transparent)
                            .clickable { deathFloor = floor },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(label, color = if (isSel) TextPrimary else TextSecondary, fontSize = 13.sp)
                    }
                }
            }
        }

        // Data Management (SAF Export / Import / Wipe)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Data & Ledger", color = TextSecondary, fontSize = 13.sp)

            Button(
                onClick = { exportLauncher.launch("timeframe-usage.json") },
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceRaised),
                modifier = Modifier.fillMaxWidth().height(44.dp)
            ) {
                Text("Export ledger (JSON)", color = TextPrimary, fontSize = 13.sp)
            }

            Button(
                onClick = { importLauncher.launch(arrayOf("application/json")) },
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceRaised),
                modifier = Modifier.fillMaxWidth().height(44.dp)
            ) {
                Text("Import ledger", color = TextPrimary, fontSize = 13.sp)
            }

            Button(
                onClick = { showWipeDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
                    .border(1.dp, StateError, RoundedCornerShape(22.dp))
            ) {
                Text("Wipe ledger", color = StateError, fontSize = 13.sp)
            }
        }

        Text(
            "All ledger metrics are free and local-first. No accounts, no trackers.",
            color = TextTertiary,
            fontSize = 12.sp
        )
    }

    if (showWipeDialog) {
        AlertDialog(
            onDismissRequest = { showWipeDialog = false },
            title = { Text("Wipe ledger", color = TextPrimary) },
            text = { Text("This deletes all recorded local sessions. This action cannot be undone.", color = TextSecondary) },
            confirmButton = {
                TextButton(onClick = { showWipeDialog = false }) {
                    Text("Confirm Wipe", color = StateError)
                }
            },
            dismissButton = {
                TextButton(onClick = { showWipeDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = SurfaceRaised
        )
    }
}
