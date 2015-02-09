package com.adusoft.web.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class ExceptionControllerAdvice {

  @ExceptionHandler(NotAuthorizedUserException.class)
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  @ResponseBody
  public String notAuthorizedUserException(NotAuthorizedUserException e) {
    return "{\"message\":\" " + e.getMessage() + "\"}";
  }

  @ExceptionHandler(BadRequestException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  @ResponseBody
  public String badRequestException(BadRequestException e) {
    return "{\"message\":\" " + e.getMessage() + "\"}";
  }

  @ExceptionHandler(InternalServerException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  @ResponseBody
  public String internalServerException(InternalServerException e) {
    return "{\"message\":\" " + e.getMessage() + "\"}";
  }


}