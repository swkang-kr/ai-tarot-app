package com.aitarot.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleOAuthIntent(getIntent());
        setupAdBannerSpacing();
    }

    /**
     * AdMob 배너 공간 확보: WebView에 하단 패딩을 추가하여
     * BottomNav가 배너 위에 위치하도록 함
     */
    private void setupAdBannerSpacing() {
        // 레이아웃이 완료된 후 실행
        View rootView = findViewById(android.R.id.content);
        if (rootView != null) {
            rootView.post(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    // Adaptive Banner 높이 (약 60dp)
                    DisplayMetrics dm = getResources().getDisplayMetrics();
                    int bannerHeightPx = (int) (60 * dm.density);
                    webView.setPadding(0, 0, 0, bannerHeightPx);
                    webView.setClipToPadding(false);
                }
            });
        }
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
