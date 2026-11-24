package com.example.corebar.data.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "corebar_auth")

class AuthRepository(
    private val context: Context,
) {

    suspend fun restoreSessionIntoHolder() {
        val prefs = context.authDataStore.data.first()
        val token = prefs[KEY_TOKEN]
        if (token.isNullOrBlank()) {
            AuthTokenHolder.clear()
            return
        }
        val idUsuario = prefs[KEY_USER_ID] ?: -1
        if (idUsuario < 0) {
            AuthTokenHolder.clear()
            return
        }
        AuthTokenHolder.accessToken = token
        AuthTokenHolder.profile = StoredUserProfile(
            idUsuario = idUsuario,
            nombre = prefs[KEY_NOMBRE],
            username = prefs[KEY_USERNAME],
            rol = prefs[KEY_ROL],
        )
    }

    suspend fun saveSession(token: String, profile: StoredUserProfile) {
        AuthTokenHolder.accessToken = token
        AuthTokenHolder.profile = profile
        context.authDataStore.edit { p ->
            p[KEY_TOKEN] = token
            p[KEY_USER_ID] = profile.idUsuario
            profile.nombre?.let { p[KEY_NOMBRE] = it }
            profile.username?.let { p[KEY_USERNAME] = it }
            profile.rol?.let { p[KEY_ROL] = it }
        }
    }

    suspend fun clearSession() {
        AuthTokenHolder.clear()
        context.authDataStore.edit { it.clear() }
    }

    fun sessionFlow() = context.authDataStore.data.map { prefs ->
        prefs[KEY_TOKEN] != null && (prefs[KEY_USER_ID] ?: -1) >= 0
    }

    companion object {
        private val KEY_TOKEN = stringPreferencesKey("access_token")
        private val KEY_USER_ID = intPreferencesKey("user_id")
        private val KEY_NOMBRE = stringPreferencesKey("nombre")
        private val KEY_USERNAME = stringPreferencesKey("username")
        private val KEY_ROL = stringPreferencesKey("rol")
    }
}
