import { useEffect, useRef } from 'react';

export const useCleanup = () => {
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  
  const addCleanup = (fn: () => void) => {
    cleanupFunctionsRef.current.push(fn);
  };
  
  const cleanupAll = () => {
    console.log(`🧹 Exécution de ${cleanupFunctionsRef.current.length} fonctions de cleanup`);
    
    // Exécuter toutes les fonctions de cleanup
    cleanupFunctionsRef.current.forEach((fn, index) => {
      try {
        fn();
        console.log(`  ✓ Cleanup ${index + 1} terminé`);
      } catch (error) {
        console.error(`  ❌ Erreur cleanup ${index + 1}:`, error);
      }
    });
    
    // Vider le tableau
    cleanupFunctionsRef.current = [];
  };
  
  // Cleanup automatique quand le composant se démonte
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);
  
  return { addCleanup, cleanupAll };
};

export default useCleanup;