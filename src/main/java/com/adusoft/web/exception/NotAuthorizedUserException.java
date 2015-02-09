package com.adusoft.web.exception;

public class NotAuthorizedUserException extends RuntimeException {

  public NotAuthorizedUserException(String message) {
    super(message);
  }

}
