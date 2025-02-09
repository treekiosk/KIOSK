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

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import io.appwrite.Client;
import io.appwrite.extensions.ClientExtensionsKt;
import io.appwrite.Query;
import io.appwrite.exceptions.AppwriteException;
import io.appwrite.models.Document;
import io.appwrite.models.DocumentList;
import io.appwrite.models.User;
import io.appwrite.services.Account;
import io.appwrite.services.Databases;
import io.appwrite.enums.OAuthProvider;
import kotlinx.coroutines.CoroutineScope;
import kotlinx.coroutines.Dispatchers;
import kotlinx.coroutines.launch;
import kotlin.coroutines.EmptyCoroutineContext;

import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private Client client;
    private Account account;
    private Databases database;
    private final ExecutorService executorService = Executors.newFixedThreadPool(3);

    private static final String DATABASE_ID = "tree-kiosk";
    private static final String COLLECTION_ID = "owner";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());

        webView.addJavascriptInterface(new AndroidInterface(), "AndroidInterface");
        webView.loadUrl("file:///android_asset/index.html");

        client = ClientExtensionsKt.Client(
                "https://cloud.appwrite.io/v1",
                "tree-kiosk",
                true
        );

        account = new Account(client);
        database = new Databases(client);
    }

    private class AndroidInterface {
        @JavascriptInterface
        public void loginWithOAuth() {
            runOnUiThread(() -> {
                try {
                    CoroutineScope scope = CoroutineScope(Dispatchers.getMain() + EmptyCoroutineContext.INSTANCE);
                    scope.launch {
                        try {
                            account.createOAuth2Session(
                                    MainActivity.this,
                                    OAuthProvider.GOOGLE
                            );
                        } catch (Exception e) {
                            Log.e("OAuth", "OAuth Exception", e);
                            webView.evaluateJavascript("handleAuthResult(false, false);", null);
                        }
                    }
                } catch (Exception e) {
                    Log.e("OAuth", "OAuth Exception", e);
                    webView.evaluateJavascript("handleAuthResult(false, false);", null);
                }
            });
        }

        @JavascriptInterface
        public void checkAuthState() {
            executorService.execute(() -> {
                try {
                    User user = account.get(User.class).execute();
                    String email = user.getEmail();

                    checkMembership(email, isMember -> {
                        String script = "handleAuthResult(true, " + isMember + ");";
                        runOnUiThread(() -> webView.evaluateJavascript(script, null));
                    });
                } catch (AppwriteException e) {
                    Log.e("Auth", "Appwrite 로그인 상태 확인 실패", e);
                    runOnUiThread(() -> webView.evaluateJavascript("handleAuthResult(false, false);", null));
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
                    account.deleteSession("current", Object.class).execute();
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "로그아웃 성공", Toast.LENGTH_SHORT).show();
                        webView.evaluateJavascript("handleAuthResult(false, false);", null);
                    });
                } catch (AppwriteException e) {
                    Log.e("Logout", "로그아웃 실패", e);
                }
            });
        }
    }

    private void checkMembership(String email, MembershipCallback callback) {
        List<String> queries = Collections.singletonList(Query.Companion.equal("email", email));

        executorService.execute(() -> {
            try {
                DocumentList<Map<String, Object>> response = database.listDocuments(
                        DATABASE_ID,
                        COLLECTION_ID,
                        queries,
                        Map.class
                ).execute();

                boolean isActive = false;

                if (!response.getDocuments().isEmpty()) {
                    Document<Map<String, Object>> firstDocument = response.getDocuments().get(0);
                    Map<String, Object> data = firstDocument.getData();
                    Object activeValue = data.get("active");

                    if (activeValue instanceof Boolean) {
                        isActive = (Boolean) activeValue;
                    } else {
                        Log.w("Membership", "Unexpected value for 'active' field: " + activeValue);
                    }
                }

                boolean finalIsActive = isActive;
                runOnUiThread(() -> callback.onResult(finalIsActive));
            } catch (AppwriteException e) {
                Log.e("Membership", "회원 상태 확인 실패", e);
                runOnUiThread(() -> callback.onResult(false));
            }
        });
    }

    interface MembershipCallback {
        void onResult(boolean isActive);
    }
}
