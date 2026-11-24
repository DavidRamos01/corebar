package com.example.corebar.ui.session

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.example.corebar.data.auth.AuthTokenHolder

class MainSessionViewModel : ViewModel() {
    var displayName by mutableStateOf("")
        private set

    /** Id del usuario autenticado; -1 si no hay sesión. */
    var userId by mutableStateOf(-1)
        private set

    /** Tras login o al restaurar sesión. */
    fun syncFromStoredProfile() {
        val p = AuthTokenHolder.profile
        displayName = p?.nombre?.trim()?.takeUnless { it.isBlank() }
            ?: p?.username.orEmpty()
        userId = p?.idUsuario ?: -1
    }

    fun clear() {
        displayName = ""
        userId = -1
    }
}
