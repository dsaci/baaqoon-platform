import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Sparkles, Star, X } from 'lucide-react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Check if the user just registered using router state
    if (location.state?.justRegistered) {
      setIsOpen(true);
      // Clean up the state so it doesn't trigger again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  if (!isOpen || !user) return null;

  const isStudent = user.primaryRole === 'student';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-baaqoon-900/40 backdrop-blur-md transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-baaqoon-900 w-full max-w-lg rounded-2xl shadow-2xl p-8 overflow-hidden animate-fade-in-up border border-baaqoon-100 dark:border-baaqoon-800">
        {/* Decorative background strip */}
        <div className="absolute top-0 inset-x-0 h-4 flag-strip" />
        <div className="absolute top-4 inset-x-0 h-32 bg-gradient-to-b from-baaqoon-100 to-white opacity-50" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-6 text-baaqoon-400 hover:text-baaqoon-900 dark:text-white z-10 p-2 rounded-full hover:bg-baaqoon-50 dark:bg-baaqoon-950 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center mt-6">
          <div className="w-20 h-20 rounded-full bg-baaqoon-100 dark:bg-baaqoon-900/50 flex items-center justify-center text-baaqoon-accent mb-6 shadow-sm ring-8 ring-white">
            {isStudent ? <Sparkles className="w-10 h-10" /> : <Star className="w-10 h-10" />}
          </div>
          
          <h2 className="text-3xl font-bold text-baaqoon-900 dark:text-white mb-3">
            مرحباً بك {user.firstName}! 🎉
          </h2>
          
          {isStudent ? (
            <p className="text-lg text-baaqoon-600 dark:text-baaqoon-400 leading-relaxed mb-8">
              لقد انضممت الآن إلى منصة <strong>باقون</strong>. 
              <br/>
              رحلة التوجيهي ليست سهلة، لكننا هنا لنبني مستقبلك معاً خطوة بخطوة. طريق النجاح يبدأ من اليوم! ✌️
            </p>
          ) : (
            <p className="text-lg text-baaqoon-600 dark:text-baaqoon-400 leading-relaxed mb-8">
              فخورون بانضمامك لكادر <strong>باقون</strong>. 
              <br/>
              أنت لست مجرد مُعلّم، أنت صانع أمل ومرشد لأجيال تبني الوطن. رسالتك عظيمة ونحن هنا لدعمك! 🫒
            </p>
          )}

          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-3.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isStudent ? 'أنا مستعد للبدء!' : 'لنبدأ رحلة التعليم!'}
          </button>
        </div>
      </div>
    </div>
  );
}
