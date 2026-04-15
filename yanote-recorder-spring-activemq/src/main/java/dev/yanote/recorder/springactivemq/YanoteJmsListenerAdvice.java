package dev.yanote.recorder.springactivemq;

import jakarta.jms.Message;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;

final class YanoteJmsListenerAdvice implements MethodInterceptor {
    private final YanoteJmsEventRecorder recorder;

    YanoteJmsListenerAdvice(YanoteJmsEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        Message message = YanoteJmsListenerState.currentMessage();
        Object destinationHint = null;
        try {
            destinationHint = message == null ? null : message.getJMSDestination();
        } catch (Exception ignored) {
            destinationHint = null;
        }
        try {
            Object result = invocation.proceed();
            if (message != null) {
                recorder.recordReceive(destinationHint, message, false);
            }
            return result;
        } catch (Throwable ex) {
            if (message != null) {
                recorder.recordReceive(destinationHint, message, true);
            }
            throw ex;
        } finally {
            YanoteJmsListenerState.clear();
        }
    }
}
