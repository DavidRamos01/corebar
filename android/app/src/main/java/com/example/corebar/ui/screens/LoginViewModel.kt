package com.example.corebar.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.corebar.data.auth.AuthRepository
import com.example.corebar.data.auth.StoredUserProfile
import com.example.corebar.data.remote.ApiClient
import com.example.corebar.data.remote.classifyNetworkFailure
import com.example.corebar.data.remote.dto.LoginRequestBody
import com.example.corebar.data.remote.parseApiError
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class LoginUiState(
    val loading: Boolean = false,
    val error: String? = null,
)

class LoginViewModel(
    private val authRepository: AuthRepository,
) : ViewModel() {

    var uiState by mutableStateOf(LoginUiState())
        private set

    fun clearError() {
        uiState = uiState.copy(error = null)
    }

    fun login(username: String, password: String, onSuccess: () -> Unit) {
        val u = username.trim()
        if (u.isEmpty() || password.isEmpty()) {
            uiState = uiState.copy(error = "credentials_empty")
            return
        }
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = withContext(Dispatchers.IO) { ApiClient.service }
                val resp = api.login(LoginRequestBody(u, password))
                if (!resp.isSuccessful) {
                    throw IllegalStateException(parseApiError(resp))
                }
                val body = resp.body() ?: throw IllegalStateException("empty_body")
                val token = body.accessToken?.takeIf { it.isNotBlank() }
                    ?: throw IllegalStateException("no_token")
                val usuario =
                    body.usuario ?: throw IllegalStateException(parseApiError(resp))
                val id = usuario.idUsuario ?: throw IllegalStateException("no_user_id")
                val profile = StoredUserProfile(
                    idUsuario = id,
                    nombre = usuario.nombre,
                    username = usuario.username,
                    rol = usuario.rol,
                )
                authRepository.saveSession(token, profile)
                uiState = uiState.copy(loading = false, error = null)
                onSuccess()
            }.onFailure { e ->
                val network = classifyNetworkFailure(e)
                val msg = when {
                    network != null -> network
                    e.message == "credentials_empty" -> "credentials_empty"
                    else -> e.message?.ifBlank { null } ?: "generic"
                }
                uiState = uiState.copy(loading = false, error = msg)
            }
        }
    }

    companion object {
        fun factory(repo: AuthRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return LoginViewModel(repo) as T
                }
            }
    }
}
