package com.byeolbit.unse;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleOAuthIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleOAuthIntent(intent);
    }

    /**
     * OAuthActivity로부터 전달받은 OAuth 콜백 URL을 JS 이벤트로 전달
     * (loadUrl 대신 evaluateJavascript 사용 → 페이지 이동 없이 즉시 code 교환)
     */
    private void handleOAuthIntent(Intent intent) {
        if (intent != null && intent.hasExtra("oauth_url")) {
            String oauthUrl = intent.getStringExtra("oauth_url");
            if (oauthUrl != null && getBridge() != null && getBridge().getWebView() != null) {
                // JSON 이스케이프 처리 후 CustomEvent로 dispatch
                String escaped = oauthUrl.replace("\\", "\\\\").replace("'", "\\'");
                String js = "window.dispatchEvent(new CustomEvent('nativeOAuthCallback', { detail: '" + escaped + "' }))";
                getBridge().getWebView().post(() ->
                    getBridge().getWebView().evaluateJavascript(js, null)
                );
            }
        }
    }
}
