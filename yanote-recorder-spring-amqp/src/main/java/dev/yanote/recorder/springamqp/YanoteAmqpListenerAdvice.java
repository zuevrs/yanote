package dev.yanote.recorder.springamqp;

import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.springframework.amqp.core.Message;

final class YanoteAmqpListenerAdvice implements MethodInterceptor {
    private final YanoteAmqpEventRecorder recorder;

    YanoteAmqpListenerAdvice(YanoteAmqpEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        Message message = YanoteAmqpListenerState.currentMessage();
        try {
            Object result = invocation.proceed();
            if (message != null) {
                recorder.recordReceive(message, false);
            }
            return result;
        } catch (Throwable ex) {
            if (message != null) {
                recorder.recordReceive(message, true);
            }
            throw ex;
        } finally {
            YanoteAmqpListenerState.clear();
        }
    }
}
