package com.example.corebar.data.remote

import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/** Retrofit / OkHttp suelen encapsular errores TCP en [java.io.IOException] */
internal fun classifyNetworkFailure(t: Throwable): String? {
    var cur: Throwable? = t
    while (cur != null) {
        when (cur) {
            is SocketTimeoutException -> return "NETWORK_TIMEOUT"
            is UnknownHostException -> return "NETWORK_HOST"
            is ConnectException -> return "NETWORK_CONNECT"
        }
        val m = cur.message.orEmpty().lowercase()
        if ("failed to connect" in m) return "NETWORK_TIMEOUT"
        if ("connection refused" in m || "ECONNREFUSED" in cur.message.orEmpty()) {
            return "NETWORK_REFUSED"
        }
        cur = cur.cause
    }
    return null
}
