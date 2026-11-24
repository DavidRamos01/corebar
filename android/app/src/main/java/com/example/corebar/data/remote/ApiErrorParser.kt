package com.example.corebar.data.remote

import com.example.corebar.data.remote.dto.ApiErrorBody
import com.google.gson.Gson
import retrofit2.Response

private val gson = Gson()

fun parseApiError(response: Response<*>): String {
    val raw = response.errorBody()?.string().orEmpty()
    if (raw.isBlank()) {
        return "Error HTTP ${response.code()}"
    }
    return runCatching { gson.fromJson(raw, ApiErrorBody::class.java)?.error }
        .getOrNull()
        ?.takeIf { it.isNotBlank() }
        ?: raw
}
