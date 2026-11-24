package com.example.corebar.data.auth

import okhttp3.Interceptor
import okhttp3.Response

class AuthBearerInterceptor(
    private val holder: AuthTokenHolder = AuthTokenHolder,
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val path = original.url.encodedPath.trimEnd('/')
        if (path.endsWith(API_AUTH_LOGIN_PATH)) {
            return chain.proceed(original)
        }
        val token = holder.accessToken ?: return chain.proceed(original)
        val withAuth = original.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        return chain.proceed(withAuth)
    }

    companion object {
        const val API_AUTH_LOGIN_PATH = "/api/auth/login"
    }
}
