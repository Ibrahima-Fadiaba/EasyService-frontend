import { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { 
  useCommencerDemandeMutation,
  useTerminerDemandeMutation,
  useCreateFactureMutation
} from "../../API/demandesApi";
import { FiCalendar, FiCheck, FiChevronDown, FiChevronUp, FiClock, FiFileText, FiLoader, FiMapPin, FiPlay, FiUser, FiX } from "react-icons/fi";
import ConfirmationModal from "../Modals/ConfirmationModal"

export default function InterventionCard({ intervention, onRefresh }) {
  const [showDetails, setShowDetails] = useState(false);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    action: null, // 'commencer' ou 'terminer'
    id: null
  });
  
  // Initialisation des mutations RTK Query
  const [commencerDemande, { isLoading: isStarting }] = useCommencerDemandeMutation();
  const [terminerDemande, { isLoading: isFinishing }] = useTerminerDemandeMutation();
  const [createFacture] = useCreateFactureMutation();

  const formatHeure = (dateString) => {
    try {
      return format(parseISO(dateString), "HH:mm", { locale: fr });
    } catch {
      return "Heure non définie";
    }
  };

  //console.log(intervention);


  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return "Date non définie";
    }
  };

  const generateFacture = async (id) => {
    try {
      await createFacture({
        montant: intervention.tarif,
        service: intervention?.serviceId,
        technicien: intervention?.technicienId,
        client: intervention?.clientId,
        admin: intervention?.adminId,
        refDemande: id
      }).unwrap();
      
      toast.success("Facture générée avec succès");
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err.data?.message || "Erreur lors de la génération de la facture"
      );
    }
  };

  // const handleStatusChange = async (action, id) => {
  //   if (!window.confirm(`Voulez-vous ${action} cette intervention ?`)) return;

  //   try {
  //     if (action === "commencer") {
  //       await commencerDemande({id,body:{ dateDebut: new Date().toISOString()}}).unwrap();
  //       toast.success("Intervention démarrée avec succès");
  //       onRefresh?.("en_cours")
  //     } else {
  //       await terminerDemande({id,body : { dateFin: new Date().toISOString()}}).unwrap();
  //       toast.success("Intervention terminée avec succès");
  //       await generateFacture(id);
  //       onRefresh?.("terminee")
  //     }

  //   } catch (err) {
  //     console.error("Erreur détaillée:", err);
  //     toast.error(
  //       err.data?.message ||
  //       `Échec de l'opération` ||
  //       "Erreur inconnue, veuillez réessayer"
  //     );
  //   }
  // };

  const handleStatusChange = (action, id) => {
    setConfirmationState({
      isOpen: true,
      action,
      id
    });
  };

  const handleConfirmAction = async () => {
    const { action, id } = confirmationState;
    
    try {
      if (action === "commencer") {
        await commencerDemande({id, body: { dateDebut: new Date().toISOString() }}).unwrap();
        toast.success("Intervention démarrée avec succès");
        onRefresh?.("en_cours");
      } else {
        await terminerDemande({id, body: { dateFin: new Date().toISOString() }}).unwrap();
        toast.success("Intervention terminée avec succès");
        await generateFacture(id);
        onRefresh?.("terminee");
      }
    } catch (err) {
      console.error("Erreur détaillée:", err);
      toast.error(
        err.data?.message ||
        `Échec de l'opération` ||
        "Erreur inconnue, veuillez réessayer"
      );
    } finally {
      setConfirmationState({ isOpen: false, action: null, id: null });
    }
  };


  const getStatusBadge = (status) => {
    const statusMap = {
      non_commencee: {
        text: "Non commencée",
        icon: <FiClock className="w-4 h-4 m-1" />,
        color: "bg-gray-100 text-gray-800"
      },
      en_cours: { 
        text: "En cours", 
        icon: <FiPlay className="w-4 h-4 m-1" />,
        color: "bg-blue-100 text-blue-800" 
      },
      terminee: { 
        text: "Terminée", 
        icon: <FiCheck className="w-4 h-4 m-1" />,
        color: "bg-green-100 text-green-800" 
      },
      annulee: { 
        text: "Annulée", 
        icon: <FiX className="w-4 h-4 m-1" />,
        color: "bg-red-100 text-red-800" 
      },
    };

    const statusInfo = statusMap[status] || statusMap.non_commencee;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.text}
      </span>
    );
  };

  if (!intervention) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
          {/* Nom du service */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiFileText className="w-5 h-5 mr-2 text-blue-500" />
              {intervention?.service?.nom || intervention?.service || "Service non spécifié"}
            </h3>
          </div>
          {getStatusBadge(intervention?.etatExecution)}
        </div>
            <div className="mt-1 flex gap-2 flex-wrap items-center text-sm text-gray-500 capitalize">
              <FiUser className="w-4 h-4 mr-1.5" />
              {intervention?.client?.prenom || intervention?.client || "Client non spécifié"}
              {intervention?.client?.nom && ` ${intervention?.client?.nom}`}
            </div>

          {/* Dates et heures de l'intervention */}
        <div className="mt-4 flex justify-between items-center flex-wrap gap-3 text-sm">
          <div className="flex items-center">
            <FiCalendar className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>{formatDate(intervention?.dateIntervention)}</span>
          </div>
          <div className="flex items-center">
            <FiClock className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>
              {(intervention?.etatExecution === "non_commencee" || intervention?.etatExecution === "annulee") && formatHeure(intervention?.dateIntervention)}
              {intervention?.etatExecution === "en_cours" && (formatHeure(intervention?.dateIntervention) + " - En cours")}
              {intervention?.etatExecution === "terminee" && (formatHeure(intervention?.heureDebut || intervention?.dates?.debutIntervention) + ` - ${formatHeure(intervention?.heureFin || intervention?.dates?.finIntervention)}` )}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>{showDetails ? "Masquer les détails" : "Voir les détails"}</span>
          {showDetails ? (
            <FiChevronUp className="w-4 h-4" />
          ) : (
            <FiChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4 border-t border-gray-200"
        >
          <div className="mt-4 space-y-3 text-sm">
            {/* Adresse */}
            <div className="flex items-start">
              <FiMapPin className="flex-shrink-0 mt-0.5 w-4 h-4 mr-1.5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-700">Adresse</p>
                <p className="text-gray-600 line-clamp-1 capitalize">
                  {intervention.adresse || "Non spécifiée"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start">
              <FiFileText className="flex-shrink-0 mt-0.5 w-4 h-4 mr-1.5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-700">Description</p>
                <p className="text-gray-600">
                  {intervention.description || "Aucune description"}
                </p>
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="mt-4 flex gap-2">
            {intervention.etatExecution === "non_commencee" && (
              <button
                onClick={() => handleStatusChange("commencer", intervention._id)}
                disabled={isStarting}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <FiPlay className="w-4 h-4" />
                )}
                Commencer
              </button>
            )}

            {intervention.etatExecution === "en_cours" && (
              <button
                onClick={() => handleStatusChange("terminer", intervention._id)}
                disabled={isFinishing}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFinishing ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <FiCheck className="w-4 h-4" />
                )}
                Terminer
              </button>
            )}
          </div>
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={`Confirmer l'action`}
        message={`Voulez-vous vraiment ${confirmationState.action === 'commencer' ? 'démarrer' : 'terminer'} cette intervention ?`}
        confirmText={confirmationState.action === 'commencer' ? 'Démarrer' : 'Terminer'}
        cancelText="Annuler"
        type={confirmationState.action === 'commencer' ? 'info' : 'success'}
      />
    </motion.div>
  );
}