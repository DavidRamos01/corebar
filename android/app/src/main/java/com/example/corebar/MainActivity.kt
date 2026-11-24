package com.example.corebar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.corebar.data.auth.AuthTokenHolder
import com.example.corebar.ui.components.ReadyToast
import com.example.corebar.ui.screens.KitchenStatusScreen
import com.example.corebar.ui.screens.KitchenStatusViewModel
import com.example.corebar.ui.screens.LoginScreen
import com.example.corebar.ui.screens.LoginViewModel
import com.example.corebar.ui.screens.TableMapScreen
import com.example.corebar.ui.screens.TakeOrderScreen
import com.example.corebar.ui.screens.WaiterHomeScreen
import com.example.corebar.ui.session.MainSessionViewModel
import com.example.corebar.ui.theme.CorebarTheme
import kotlinx.coroutines.launch

private object Dest {
    const val Login           = "login"
    const val Waiter          = "waiter"
    const val TakeOrder       = "take_order"
    const val TakeOrderFromMap = "take_order/{mesaId}"
    const val TableMap        = "table_map"
    const val KitchenStatus   = "kitchen_status"
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val app = LocalContext.current.applicationContext as CorebarApplication
            val loginFactory = remember { LoginViewModel.factory(app.authRepository) }
            val loginVm: LoginViewModel        = viewModel(factory = loginFactory)
            val session: MainSessionViewModel  = viewModel()
            val kitchenVm: KitchenStatusViewModel = viewModel(
                factory = KitchenStatusViewModel.factoryFor(app),
            )
            val navController = rememberNavController()
            val scope = rememberCoroutineScope()

            LaunchedEffect(Unit) {
                if (AuthTokenHolder.accessToken != null) {
                    session.syncFromStoredProfile()
                    AuthTokenHolder.profile?.idUsuario?.let { kitchenVm.startFor(it) }
                    navController.navigate(Dest.Waiter) {
                        popUpTo(Dest.Login) { inclusive = true }
                    }
                }
            }

            CorebarTheme {
                Box(modifier = Modifier.fillMaxSize()) {

                    /* Contenido principal */
                    Surface(modifier = Modifier.fillMaxSize()) {
                        NavHost(
                            navController    = navController,
                            startDestination = Dest.Login,
                        ) {
                            composable(Dest.Login) {
                                LoginScreen(
                                    vm = loginVm,
                                    onAuthenticated = {
                                        session.syncFromStoredProfile()
                                        AuthTokenHolder.profile?.idUsuario
                                            ?.let { kitchenVm.startFor(it) }
                                        navController.navigate(Dest.Waiter) {
                                            popUpTo(Dest.Login) { inclusive = true }
                                        }
                                    },
                                )
                            }
                            composable(Dest.Waiter) {
                                BackHandler(enabled = true) { }
                                WaiterHomeScreen(
                                    displayName    = session.displayName,
                                    onTakeOrder    = { navController.navigate(Dest.TakeOrder) },
                                    onOpenTableMap = { navController.navigate(Dest.TableMap) },
                                    onKitchenStatus = { navController.navigate(Dest.KitchenStatus) },
                                    onLogout = {
                                        scope.launch {
                                            app.authRepository.clearSession()
                                            session.clear()
                                            kitchenVm.stop()
                                            navController.navigate(Dest.Login) {
                                                popUpTo(Dest.Waiter) { inclusive = true }
                                                launchSingleTop = true
                                            }
                                        }
                                    },
                                )
                            }
                            composable(Dest.TableMap) {
                                TableMapScreen(
                                    currentUserId = session.userId,
                                    onBack = { navController.popBackStack() },
                                    onOpenTakeOrderForMesa = { mesaId ->
                                        navController.navigate("take_order/$mesaId")
                                    },
                                )
                            }
                            composable(Dest.TakeOrder) {
                                TakeOrderScreen(onBack = { navController.popBackStack() })
                            }
                            composable(
                                route     = Dest.TakeOrderFromMap,
                                arguments = listOf(
                                    navArgument("mesaId") { type = NavType.IntType },
                                ),
                            ) { entry ->
                                val mesaId = entry.arguments?.getInt("mesaId") ?: -1
                                TakeOrderScreen(
                                    onBack                = { navController.popBackStack() },
                                    initialMesaIdFromMap  = mesaId.takeIf { it > 0 },
                                )
                            }
                            composable(Dest.KitchenStatus) {
                                KitchenStatusScreen(
                                    vm     = kitchenVm,
                                    onBack = { navController.popBackStack() },
                                )
                            }
                        }
                    }

                    /* Toast in-app global */
                    AnimatedVisibility(
                        visible  = kitchenVm.uiState.newReadyLines.isNotEmpty(),
                        enter    = slideInVertically(
                            initialOffsetY = { -it },
                            animationSpec  = spring(
                                dampingRatio = Spring.DampingRatioMediumBouncy,
                                stiffness    = Spring.StiffnessMedium,
                            ),
                        ) + fadeIn(),
                        exit     = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .fillMaxWidth()
                            .statusBarsPadding(),
                    ) {
                        ReadyToast(
                            lines     = kitchenVm.uiState.newReadyLines,
                            onDismiss = { kitchenVm.clearReadyBanner() },
                        )
                    }
                }
            }
        }
    }
}
