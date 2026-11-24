package com.example.corebar

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import coil.Coil
import coil.ImageLoader
import com.example.corebar.data.auth.AuthRepository
import com.example.corebar.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import java.util.concurrent.Executors

class CorebarApplication : Application() {

    lateinit var authRepository: AuthRepository

    override fun onCreate() {
        super.onCreate()

        // Coil con User-Agent de navegador para que servidores de imágenes no bloqueen la petición
        Coil.setImageLoader(
            ImageLoader.Builder(this)
                .okHttpClient {
                    OkHttpClient.Builder()
                        .addInterceptor { chain ->
                            chain.proceed(
                                chain.request().newBuilder()
                                    .header(
                                        "User-Agent",
                                        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Safari/537.36"
                                    )
                                    .build()
                            )
                        }
                        .build()
                }
                .crossfade(true)
                .build()
        )

        authRepository = AuthRepository(applicationContext)

        // Canal de notificaciones para platos listos en cocina
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "corebar_kitchen_ready",
                "Platos listos para recoger",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Avisa al camarero cuando un plato está listo en cocina"
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }

        runBlocking(Dispatchers.IO) {
            authRepository.restoreSessionIntoHolder()
        }
        Executors.newSingleThreadExecutor().execute {
            runCatching { ApiClient.service }
        }
    }
}
