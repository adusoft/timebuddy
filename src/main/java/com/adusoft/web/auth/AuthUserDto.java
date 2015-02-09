package com.adusoft.web.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class AuthUserDto {

  private String username;

  private String password;

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }
}
