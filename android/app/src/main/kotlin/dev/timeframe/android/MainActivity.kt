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

const val CREATURE_ENABLED = false

enum class NavigationTab(val label: String) {
    Dashboard("Today"),
    Patterns("Patterns"),
    Compare("Compare")
}

@Composable
fun MainAppScreen() {
    var currentTab by remember { mutableStateOf(NavigationTab.Dashboard) }
    var showSettings by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .background(SurfaceBase)
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = if (showSettings) "Settings" else currentTab.label,
                    color = TextPrimary,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .clickable { showSettings = !showSettings },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (showSettings) "Done" else "Settings",
                        color = CatFocus,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        },
        bottomBar = {
            if (!showSettings) {
                NavigationBar(
                    containerColor = SurfaceOverlay,
                    tonalElevation = 0.dp,
                    modifier = Modifier.height(64.dp)
                ) {
                    NavigationTab.values().forEach { tab ->
                        val isSelected = currentTab == tab
                        val activeColor = if (isSelected) CatFocus else TextTertiary
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = { currentTab = tab },
                            icon = {},
                            label = {
                                Text(
                                    text = tab.label,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = activeColor
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = Color.Transparent
                            )
                        )
                    }
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
            if (showSettings) {
                SettingsScreen(onClose = { showSettings = false })
            } else {
                when (currentTab) {
                    NavigationTab.Dashboard -> DashboardScreen()
                    NavigationTab.Patterns -> PatternsScreen()
                    NavigationTab.Compare -> CompareScreen()
                }
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

        // 1. Contiguous Summary Strip (§6.2) — No four equal floating cards, no streaks/habits
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderDefault, RoundedCornerShape(10.dp))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Focus time: primary mono duration, amber
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Focus time", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text("All devices", color = TextTertiary, fontSize = 11.sp)
                        }
                        Text(
                            text = "4h 22m",
                            color = CatFocus,
                            fontSize = 40.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(BorderSubtle))

                    // Sink time and Deep blocks row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Sink time", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text(
                                text = "1h 08m",
                                color = CatSink,
                                fontSize = 24.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Column(
                            horizontalAlignment = Alignment.End,
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text("Deep blocks (≥15m)", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Row(
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "4",
                                    color = TextPrimary,
                                    fontSize = 24.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "longest 45m",
                                    color = TextTertiary,
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    // Strongest eligible observation (§6.2)
                    Surface(
                        color = SurfaceBase,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderSubtle, RoundedCornerShape(6.dp))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Your longest recorded focus block lasted 45 minutes.",
                                color = TextSecondary,
                                fontSize = 12.sp,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = "Evidence",
                                color = CatFocus,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }

        // 2. Time by Category (§6.3): Stacked horizontal bar, 10dp high
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderDefault, RoundedCornerShape(10.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Time by category", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        Text("5h 30m total", color = TextTertiary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                    }

                    // 10dp high stacked category bar (§6.3)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(RoundedCornerShape(3.dp))
                    ) {
                        Box(modifier = Modifier.weight(62f).fillMaxHeight().background(CatFocus))
                        Box(modifier = Modifier.weight(16f).fillMaxHeight().background(CatSink))
                        Box(modifier = Modifier.weight(3f).fillMaxHeight().background(CatGames))
                        Box(modifier = Modifier.weight(19f).fillMaxHeight().background(CatUnclassified))
                    }

                    // Legend rows with exact durations and approved percentages
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        MixRow("Work", "4h 22m · 62%", CatFocus)
                        MixRow("Sinks", "1h 08m · 16%", CatSink)
                        MixRow("Games", "12m · 3%", CatGames)
                        MixRow("Unclassified", "19% unclassified", CatUnclassified)
                    }
                }
            }
        }

        // 3. Apps Section (§6.3): 5 rows, Sessions column
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceRaised),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderDefault, RoundedCornerShape(10.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Apps", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        Text("Sessions", color = TextTertiary, fontSize = 12.sp)
                    }

                    AppRow("VS Code", "Work", "3h 40m", "12", CatFocus)
                    AppRow("Instagram", "Sink", "45m", "8", CatSink)
                    AppRow("Terminal", "Work", "42m", "6", CatFocus)
                    AppRow("YouTube", "Sink", "18m", "3", CatSink)
                    AppRow("Reddit", "Sink", "5m", "2", CatSink)
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
fun AppRow(name: String, category: String, duration: String, sessions: String, dotColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(8.dp).background(dotColor, CircleShape))
            Column {
                Text(name, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                Text(category, color = TextTertiary, fontSize = 11.sp)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(duration, color = TextPrimary, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
            Text(sessions, color = TextTertiary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
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
                    label = selectedDevice,
                    hero = "39.37h",
                    stats = listOf(
                        Week.CardStatRow("Focus-set time", "39h 22m"),
                        Week.CardStatRow("Sink", "7h 02m"),
                        Week.CardStatRow("Blocks ≥15 min", "10"),
                        Week.CardStatRow("Longest", "50 min")
                    ),
                    footer = "Tracked 7 days · phone up 1/7 · computer up 7/7 · unclassified 19% · double-counted 0.24h"
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
fun SettingsScreen(onClose: (() -> Unit)? = null) {
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
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Settings", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            if (onClose != null) {
                TextButton(onClick = onClose) {
                    Text("Done", color = CatFocus, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Sink Threshold Setting (§3.2, §1.2 neutral language)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Sink threshold — when a sink ends a focus run", color = TextSecondary, fontSize = 13.sp)
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

@Composable
fun PatternsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Patterns", color = TextPrimary, fontSize = 24.sp, fontWeight = FontWeight.SemiBold)
        Text("Window: Last 14 days", color = TextSecondary, fontSize = 14.sp)
        Surface(
            color = SurfaceRaised,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, BorderDefault, RoundedCornerShape(10.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Observational Insight", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Text("Evaluated across completed days with adequate coverage.", color = TextSecondary, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun CompareScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Compare", color = TextPrimary, fontSize = 24.sp, fontWeight = FontWeight.SemiBold)
        Text("Previous 7 days vs Prior 7 days", color = TextSecondary, fontSize = 14.sp)
        Surface(
            color = SurfaceRaised,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, BorderDefault, RoundedCornerShape(10.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Aligned Periods", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Text("Direct comparison of completed periods without overlapping pixels.", color = TextSecondary, fontSize = 14.sp)
            }
        }
    }
}

