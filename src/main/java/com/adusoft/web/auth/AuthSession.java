package com.adusoft.web.auth;

import com.adusoft.web.exception.InternalServerException;
import com.adusoft.web.exception.NotAuthorizedUserException;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

@Component
@Scope("session")
public class AuthSession {

  private Map<String, String> sessions = new HashMap<String, String>();

  private SecureRandom random = new SecureRandom();

  public String generateToken() {
    return new BigInteger(130, random).toString(32);
  }

  public void registerUser(String token, String username) {
    sessions.put(token, username);
  }

  public String hashPassword(String password) {
    String hash = "";
    try {
      MessageDigest sha = MessageDigest.getInstance("SHA-1");
      byte[] passwordHash = sha.digest(password.getBytes());
      hash = new String(passwordHash, "UTF-8");
    } catch (NoSuchAlgorithmException e) {
      throw new InternalServerException("SHA-1 exception");
    } catch (UnsupportedEncodingException e) {
      throw new InternalServerException("Encoding exception");
    }
    return hash;
  }

  public void checkToken(String authToken) {
    if (!sessions.containsKey(authToken)) {
      throw new NotAuthorizedUserException("Authentication Failure. Please login again.");
    }
  }

  public String getUserForToken(String authToken) {
    return sessions.get(authToken);
  }
}
