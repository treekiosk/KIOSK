package me.moontree.treekiosk.v3;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import io.appwrite.Client;
import io.appwrite.ID;
import io.appwrite.Query;
import io.appwrite.exceptions.AppwriteException;
import io.appwrite.models.DocumentList;
import io.appwrite.models.User;
import io.appwrite.oauth.OAuthProvider;
import io.appwrite.services.Account;
import io.appwrite.services.Databases;
import kotlin.coroutines.Continuation;
import kotlin.coroutines.CoroutineContext;
import kotlin.coroutines.EmptyCoroutineContext;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private Client client;
    private Account account;
    private Databases database;
    private final ExecutorService executorService = Executors.newFixedThreadPool(3); // Async Task Executor

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // WebView 설정
        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());

        // JavaScript와 연결될 인터페이스 추가
        webView.addJavascriptInterface(new AndroidInterface(), "AndroidInterface");

        // WebView에 HTML 파일 로드
        webView.loadUrl("file:///android_asset/index.html");

        // Appwrite 클라이언트 초기화
        client = new Client(this)
                .setEndpoint("https://cloud.appwrite.io/v1") // Appwrite 엔드포인트
                .setProject("treekiosk"); // 프로젝트 ID

        account = new Account(client);
        database = new Databases(client);
    }

    // Android와 JavaScript 연결을 위한 인터페이스 클래스
    private class AndroidInterface {
        @JavascriptInterface
        public void loginWithOAuth() {
            runOnUiThread(() -> {
                try {
                    OAuthProvider provider = OAuthProvider.Companion.google();
                    Intent intent = account.createOAuth2Session(
                        MainActivity.this,
                        provider,
                        Collections.emptyList(), // 필요한 경우 OAuth 스코프 추가 가능
                        new Continuation<Unit>() {
                            @NonNull
                            @Override
                            public CoroutineContext getContext() {
                                return EmptyCoroutineContext.INSTANCE;
                            }

                            @Override
                            public void resumeWith(@NonNull Object result) {
                                Log.d("OAuth", "OAuth 로그인 성공");
                                webView.evaluateJavascript("handleAuthResult(true, true);", null);
                            }
                        }
                    );

                    startActivity(intent);
                } catch (Exception e) {
                    Log.e("OAuth", "로그인 중 오류 발생", e);
                    webView.evaluateJavascript("handleAuthResult(false, false);", null);
                }
            });
        }

        @JavascriptInterface
        public void checkAuthState() {
            executorService.execute(() -> {
                try {
                    User user = account.get();
                    String email = user.getEmail();
                    boolean isMember = checkMembership(email);

                    String script = "handleAuthResult(true, " + isMember + ");";
                    runOnUiThread(() -> webView.evaluateJavascript(script, null));
                } catch (Exception e) {
                    Log.e("Auth", "로그인 상태 확인 실패", e);
                    runOnUiThread(() -> webView.evaluateJavascript("handleAuthResult(false, false);", null));
                }
            });
        }

        @JavascriptInterface
        public void logout() {
            executorService.execute(() -> {
                try {
                    account.deleteSession("current");
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "로그아웃 성공", Toast.LENGTH_SHORT).show();
                        webView.evaluateJavascript("handleAuthResult(false, false);", null);
                    });
                } catch (Exception e) {
                    Log.e("Auth", "로그아웃 실패", e);
                }
            });
        }

        private boolean checkMembership(String email) {
            try {
                DocumentList response = database.listDocuments(
                        "tree-kiosk", // 데이터베이스 ID
                        "owner",      // 컬렉션 ID
                        new String[]{Query.equal("email", email)} // 이메일이 일치하는 문서 찾기
                );

                if (response.getTotal() > 0) {
                    return response.getDocuments().get(0).getBoolean("active", false);
                }
            } catch (Exception e) {
                Log.e("Database", "회원 조회 실패", e);
            }
            return false;
        }
    }
}
