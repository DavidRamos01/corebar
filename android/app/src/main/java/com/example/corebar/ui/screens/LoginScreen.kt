package com.example.corebar.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Brush
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.corebar.R
import com.example.corebar.ui.components.IosFilledButton
import com.example.corebar.ui.theme.AccentBlue
import com.example.corebar.ui.theme.AccentViolet
import com.example.corebar.ui.theme.MonoBg
import com.example.corebar.ui.theme.MonoBorder
import com.example.corebar.ui.theme.MonoCard
import com.example.corebar.ui.theme.MonoInk
import com.example.corebar.ui.theme.MonoRed
import com.example.corebar.ui.theme.MonoSub
import com.example.corebar.ui.theme.MonoSubLight
import com.example.corebar.ui.theme.MonoText

@Composable
fun LoginScreen(
    vm: LoginViewModel,
    onAuthenticated: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val username = remember { mutableStateOf("") }
    val password = remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    val scroll = rememberScrollState()
    val state = vm.uiState

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    val logoScale by animateFloatAsState(
        targetValue = if (visible) 1f else 0.6f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "logo_scale",
    )

    // Pulso suave del halo del logo
    val glowTransition = rememberInfiniteTransition(label = "logo_glow")
    val glowAlpha by glowTransition.animateFloat(
        initialValue = 0.18f,
        targetValue = 0.38f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "glow_alpha",
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        AccentBlue.copy(alpha = 0.08f),
                        AccentViolet.copy(alpha = 0.04f),
                        MonoBg,
                        MonoBg,
                    ),
                ),
            ),
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(scroll)
                .padding(horizontal = 24.dp, vertical = 56.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // App icon
            Box(
                modifier = Modifier
                    .scale(logoScale)
                    .size(96.dp)
                    .shadow(
                        elevation = 22.dp,
                        shape = RoundedCornerShape(22.dp),
                        ambientColor = AccentBlue.copy(alpha = glowAlpha * 0.6f),
                        spotColor = AccentViolet.copy(alpha = glowAlpha),
                    )
                    .clip(RoundedCornerShape(22.dp))
                    .background(Color.White),
                contentAlignment = Alignment.Center,
            ) {
                Image(
                    painter = painterResource(R.drawable.ic_brand_corebar),
                    contentDescription = stringResource(R.string.cd_brand_logo),
                    modifier = Modifier.size(64.dp).clip(RoundedCornerShape(14.dp)),
                    contentScale = ContentScale.Fit,
                )
            }

            Spacer(Modifier.height(20.dp))

            // Títulos
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = stringResource(R.string.login_title),
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Bold,
                    color = MonoText,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = stringResource(R.string.login_subtitle),
                    fontSize = 16.sp,
                    color = MonoSub,
                    textAlign = TextAlign.Center,
                )
            }

            Spacer(Modifier.height(36.dp))

            // Banner de error
            state.error?.let { err ->
                val human = when (err) {
                    "credentials_empty" -> stringResource(R.string.login_error_credentials)
                    "NETWORK_TIMEOUT", "NETWORK_HOST", "NETWORK_CONNECT", "NETWORK_REFUSED" ->
                        stringResource(R.string.login_error_network_unreachable)
                    "generic", "empty_body", "no_token", "no_user_id" -> stringResource(R.string.login_error_generic)
                    else -> err
                }
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MonoRed.copy(alpha = 0.1f))
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Rounded.ErrorOutline, null, tint = MonoRed, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(human, color = MonoRed, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }
                Spacer(Modifier.height(16.dp))
            }

            // Campos agrupados estilo iOS
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(MonoCard),
            ) {
                Column {
                    TextField(
                        value = username.value,
                        onValueChange = { username.value = it; vm.clearError() },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text(stringResource(R.string.login_username_label), color = MonoSubLight) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                        colors = iosFieldColors(),
                    )
                    HorizontalDivider(color = MonoBorder, thickness = 0.5.dp, modifier = Modifier.padding(start = 16.dp))
                    TextField(
                        value = password.value,
                        onValueChange = { password.value = it; vm.clearError() },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text(stringResource(R.string.login_password_label), color = MonoSubLight) },
                        singleLine = true,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            Icon(
                                imageVector = if (showPassword) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                                contentDescription = if (showPassword) "Ocultar" else "Mostrar",
                                tint = MonoSubLight,
                                modifier = Modifier
                                    .size(22.dp)
                                    .clickable { showPassword = !showPassword },
                            )
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = iosFieldColors(),
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            IosFilledButton(
                text = if (state.loading) "Iniciando sesión…" else stringResource(R.string.login_enter),
                loading = state.loading,
                enabled = !state.loading,
                color = AccentBlue,
                onClick = { vm.login(username.value, password.value, onAuthenticated) },
            )
        }
    }
}

@Composable
private fun iosFieldColors() = TextFieldDefaults.colors(
    focusedContainerColor = Color.Transparent,
    unfocusedContainerColor = Color.Transparent,
    disabledContainerColor = Color.Transparent,
    focusedIndicatorColor = Color.Transparent,
    unfocusedIndicatorColor = Color.Transparent,
    disabledIndicatorColor = Color.Transparent,
    cursorColor = MonoInk,
    focusedTextColor = MonoText,
    unfocusedTextColor = MonoText,
)
