package com.example.corebar.data.remote

import com.example.corebar.BuildConfig
import com.example.corebar.data.auth.AuthBearerInterceptor
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private val gson = GsonBuilder().serializeNulls().create()

    private val okHttp = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(AuthBearerInterceptor())
        .addInterceptor(
            HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BASIC
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            },
        )
        .build()

    val service: CorebarApiService by lazy {
        val base = BuildConfig.API_BASE_URL.trimEnd('/') + "/"
        Retrofit.Builder()
            .baseUrl(base)
            .client(okHttp)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(CorebarApiService::class.java)
    }
}
