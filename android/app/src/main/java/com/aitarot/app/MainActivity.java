package com.aitarot.app;

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
     * OAuthActivity로부터 전달받은 OAuth 콜백 URL을 WebView에 로드
     */
    private void handleOAuthIntent(Intent intent) {
        if (intent != null && intent.hasExtra("oauth_url")) {
            String oauthUrl = intent.getStringExtra("oauth_url");
            if (oauthUrl != null && getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().loadUrl(oauthUrl);
            }
        }
    }
}
