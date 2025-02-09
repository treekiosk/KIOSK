package me.moontree.treekiosk.v3;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ComponentActivity;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import io.appwrite.Client;
import io.appwrite.Query; // Import Query
import io.appwrite.models.Document;
import io.appwrite.models.DocumentList;
import io.appwrite.models.User;
import io.appwrite.services.Account;
import io.appwrite.services.Databases;
import io.appwrite.oauth.OAuthProvider; // Import OAuthProvider

import kotlin.coroutines.Continuation;
import kotlin.coroutines.CoroutineContext;
import kotlin.coroutines.EmptyCoroutineContext;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private Client client;
    private Account account;
    private Databases database;
    private final ExecutorService executorService = Executors.newFixedThreadPool(3);

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        webView.addJavascriptInterface(new AndroidInterface(), "AndroidInterface");
        webView.loadUrl("file:///android_asset/index.html");

        // Appwrite 클라이언트 설정
        client = new Client(MainActivity.this)
                .setEndpoint("https://cloud.appwrite.io/v1")
                .setProject("treekiosk");
        client.setSelfSigned(true);

        account = new Account(client);
        database = new Databases(client);
    }

    private class AndroidInterface {
        @JavascriptInterface
        public void loginWithOAuth() {
            runOnUiThread(() -> {
                try {
                    Intent intent = account.createOAuth2Session(
                            MainActivity.this,
                            OAuthProvider.GOOGLE, // Use OAuthProvider.GOOGLE
                            null, // success
                            null, // failure
                            (Continuation<? super Unit>) null // pass null for the Continuation
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
                    account.get(new Continuation<User>() {
                        @Override
                        public void resumeWith(Object result) {
                            if (result instanceof User) {
                                User user = (User) result;
                                String email = user.getEmail();

                                checkMembership(email, isMember -> {
                                    String script = "handleAuthResult(true, " + isMember + ");";
                                    runOnUiThread(() -> webView.evaluateJavascript(script, null));
                                });
                            }
                        }

                        @Override
                        public CoroutineContext getContext() {
                            return EmptyCoroutineContext.INSTANCE;
                        }
                    });
                } catch (Exception e) {
                    Log.e("Auth", "로그인 상태 확인 실패", e);
                    runOnUiThread(() -> webView.evaluateJavascript("handleAuthResult(false, false);", null));
                }
            });
        }

        @JavascriptInterface
        public void logout() {
            account.deleteSession("current", new Continuation<Object>() {
                @Override
                public void resumeWith(Object result) {
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "로그아웃 성공", Toast.LENGTH_SHORT).show();
                        webView.evaluateJavascript("handleAuthResult(false, false);", null);
                    });
                }

                @Override
                public CoroutineContext getContext() {
                    return EmptyCoroutineContext.INSTANCE;
                }
            });
        }
    }

    // 비동기 방식으로 멤버십 확인
    private void checkMembership(String email, MembershipCallback callback) {
        List<String> queries = Collections.singletonList(Query.Companion.equal("email", email)); // Use Query.Companion.equal

        database.listDocuments(
                "tree-kiosk", // 데이터베이스 ID
                "owner", // 컬렉션 ID
                queries,
                new Continuation<DocumentList<Map<String, Object>>>() {
                    @Override
                    public void resumeWith(Object result) {
                        boolean isActive = false;
                        if (result instanceof DocumentList) {
                            DocumentList<Map<String, Object>> response = (DocumentList<Map<String, Object>>) result;
                            if (!response.getDocuments().isEmpty()) {
                                Document<Map<String, Object>> firstDocument = response.getDocuments().get(0);
                                Map<String, Object> data = firstDocument.getData();
                                isActive = (Boolean) data.getOrDefault("active", false);
                            }
                        }
                        boolean finalIsActive = isActive;
                        runOnUiThread(() -> callback.onResult(finalIsActive));
                    }

                    @Override
                    public CoroutineContext getContext() {
                        return EmptyCoroutineContext.INSTANCE;
                    }
                }
        );
    }

    interface MembershipCallback {
        void onResult(boolean isActive);
    }
}
