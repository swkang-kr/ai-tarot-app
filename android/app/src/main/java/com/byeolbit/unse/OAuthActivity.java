package com.byeolbit.unse;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

/**
 * OAuth 콜백을 받아 MainActivity WebView로 전달하는 딥링크 핸들러.
 * Chrome Custom Tab에서 Google OAuth 완료 후
 * com.aitarot.app://auth/callback?code=xxx 로 리디렉트됨.
 */
public class OAuthActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri uri = getIntent().getData();
        if (uri != null) {
            // 딥링크 파라미터를 웹 콜백 URL로 변환
            String query = uri.getQuery() != null ? uri.getQuery() : "";
            String fragment = uri.getFragment() != null ? uri.getFragment() : "";

            // Supabase callback URL 구성
            String webUrl = "https://tarot.trendhunt.net/callback";
            if (!query.isEmpty()) {
                webUrl += "?" + query;
            }
            if (!fragment.isEmpty()) {
                webUrl += "#" + fragment;
            }

            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            mainIntent.putExtra("oauth_url", webUrl);
            startActivity(mainIntent);
        }

        finish();
    }
}
