// ── Language translations for Todolife ──────────────────────────────────────
// Supported locales: "en" (English) | "lo" (Lao / ພາສາລາວ)

export type Locale = "en" | "lo";

export const translations = {
  en: {
    // ── Common ────────────────────────────────────────────────────────────
    appName: "Todolife",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    loading: "Loading...",
    signOut: "Sign Out",
    yes: "Yes",
    no: "No",
    update: "Update",
    done: "Done",
    clearAll: "Clear All",
    edit: "Edit",

    // ── Navigation ────────────────────────────────────────────────────────
    nav: {
      menu: "Menu",
      newTasks: "New Tasks",
      myTasks: "My Tasks",
      completeTasks: "Complete Tasks",
      dashboard: "Dashboard",
      timer: "Set Timer",
      ideaNotes: "Idea Notes",
      pdfAnnotator: "PDF Annotator",
      removeBg: "Remove BG",
      agent: "Agent",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      login: "Log in",
      signup: "Sign up",
    },

    // ── Settings page ─────────────────────────────────────────────────────
    settings: {
      title: "Settings",
      subtitle: "Manage your preferences and account",

      appearance: {
        section: "Appearance",
        theme: "Theme",
        darkMode: "Dark mode",
        lightMode: "Light mode",
      },

      language: {
        section: "Language",
        label: "App Language",
        subtitle: "Choose your preferred language",
        english: "English",
        lao: "ພາສາລາວ (Lao)",
        saved: "Language updated",
      },

      notifications: {
        section: "Notifications",
        taskUpdates: "Task Updates",
        taskUpdatesDesc: "Get notified when tasks change",
        reminders: "Due Date Reminders",
        remindersDesc: "Alerts before tasks are due",
        on: "On",
        off: "Off",
      },

      account: {
        section: "Account",
        editProfile: "Edit Profile",
        noName: "No name set",
        signOut: "Sign Out",
      },

      dangerZone: {
        section: "Danger Zone",
        deleteAccount: "Delete Account",
        confirmMessage:
          "Are you sure? This will permanently delete your account and all data. This cannot be undone.",
        yesDelete: "Yes, Delete",
      },

      about: {
        section: "About",
        app: "App",
        version: "Version",
        framework: "Framework",
        builtBy: "Built by",
      },
    },

    // ── Profile page ──────────────────────────────────────────────────────
    profile: {
      title: "Profile",
      editProfile: "Edit Profile",
      cancelEdit: "Cancel Edit",
      displayName: "Display Name",
      profileImage: "Profile Image",
      selectImage: "Select Image",
      clearSelection: "Clear Selection",
      removeCurrentImage: "Remove Current Image",
      chooseAvatar: "Or Choose an Avatar",
      saveChanges: "Save Changes",
      updateDetails: "Update Your Details",
      dashboard: "Your Profile Dashboard",
      dashboardDesc:
        "Keep your details up to date to personalize your experience across the platform.",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      goodMorning: "Good morning",
      goodAfternoon: "Good afternoon",
      goodEvening: "Good evening",
      goodNight: "Good night",
      addATask: "Add a Task",
      completedToday: "Completed Today",
      pending: "Pending",
      dayStreak: "Day Streak",
      dueToday: "Due Today",
      todaysTasks: "Today's Tasks",
      noTasksToday: "No tasks due today. Enjoy your day!",
      studyStats: "Study Stats",
      total: "Total",
      noStudySessions: "No study sessions recorded yet. Head to Study Hub to start!",
      recentSessions: "Recent Sessions",
      openStudyHub: "Open Study Hub",
      focusTimer: "Focus Timer",
      selectTaskToFocus: "Select task to focus on...",
      focusing: "Focusing:",
      pomodoroSession: "25-min Pomodoro session",
      start: "Start",
      pause: "Pause",
      reset: "Reset",
      weeklyProgress: "Weekly Progress",
      recentNotes: "Recent Notes",
      noNotesYet: "No notes yet.",
      viewAllNotes: "View all notes",
      overdueTasks: "Overdue Tasks",
      due: "Due:",
    },

    // ── Task pages ────────────────────────────────────────────────────────
    tasks: {
      pending: "Pending",
      completed: "Completed",
      total: "Total",
      high: "High",
      medium: "Medium",
      low: "Low",
      work: "Work",
      study: "Study",
      activities: "Activities",
      noTasks: "No tasks yet. Add one!",
      noCompletedTasks: "No completed tasks yet",
      completeTaskHint: "Complete a task and it will appear here",
      addTask: "Add Task",
      deleteTask: "Delete Task",
      markDone: "Mark as Done",
      yourTaskList: "Your Task List",
      updateTask: "Update Task",
      title: "Title",
      description: "Description",
      dueDate: "Due Date",
      dueTime: "Due Time",
      time: "Time",
      missed: "Missed",
      tasksDone: "task(s) done",
      completedTasks: "Completed Tasks",
      addNewTask: "Add New Task",
      fillDetails: "Fill in the details below",
      taskTitle: "Task Title",
      taskType: "Task Type",
      priorityLevel: "Priority Level",
      savingTask: "Saving task...",
    },
  },

  lo: {
    // ── Common ────────────────────────────────────────────────────────────
    appName: "Todolife",
    save: "ບັນທຶກ",
    cancel: "ຍົກເລີກ",
    close: "ປິດ",
    confirm: "ຢືນຢັນ",
    loading: "ກຳລັງໂຫລດ...",
    signOut: "ອອກຈາກລະບົບ",
    yes: "ແມ່ນ",
    no: "ບໍ່",
    update: "ອັບເດດ",
    done: "ສຳເລັດ",
    clearAll: "ລຶບທັງໝົດ",
    edit: "ແກ້ໄຂ",

    // ── Navigation ────────────────────────────────────────────────────────
    nav: {
      menu: "ເມນູ",
      newTasks: "ວຽກໃໝ່",
      myTasks: "ວຽກຂອງຂ້ອຍ",
      completeTasks: "ວຽກທີ່ສຳເລັດ",
      dashboard: "ໜ້າຫຼັກ",
      timer: "ຕັ້ງໂມງ",
      ideaNotes: "ບັນທຶກແນວຄິດ",
      pdfAnnotator: "PDF Annotator",
      removeBg: "ລຶບພື້ນຫຼັງ",
      agent: "ຜູ້ຊ່ວຍ AI",
      profile: "ໂປຣໄຟລ໌",
      settings: "ການຕັ້ງຄ່າ",
      logout: "ອອກຈາກລະບົບ",
      login: "ເຂົ້າສູ່ລະບົບ",
      signup: "ລົງທະບຽນ",
    },

    // ── Settings page ─────────────────────────────────────────────────────
    settings: {
      title: "ການຕັ້ງຄ່າ",
      subtitle: "ຈັດການການຕັ້ງຄ່າ ແລະ ບັນຊີຂອງທ່ານ",

      appearance: {
        section: "ການສະແດງຜົນ",
        theme: "ຮູບແບບ",
        darkMode: "ໂໝດມືດ",
        lightMode: "ໂໝດສະຫວ່າງ",
      },

      language: {
        section: "ພາສາ",
        label: "ພາສາຂອງແອັບ",
        subtitle: "ເລືອກພາສາທີ່ທ່ານຕ້ອງການ",
        english: "English",
        lao: "ພາສາລາວ (Lao)",
        saved: "ອັບເດດພາສາແລ້ວ",
      },

      notifications: {
        section: "ການແຈ້ງເຕືອນ",
        taskUpdates: "ອັບເດດວຽກ",
        taskUpdatesDesc: "ຮັບການແຈ້ງເຕືອນເມື່ອວຽກມີການປ່ຽນແປງ",
        reminders: "ແຈ້ງເຕືອນວັນຄົບກຳໜົດ",
        remindersDesc: "ແຈ້ງເຕືອນກ່ອນວຽກຄົບກຳໜົດ",
        on: "ເປີດ",
        off: "ປິດ",
      },

      account: {
        section: "ບັນຊີ",
        editProfile: "ແກ້ໄຂໂປຣໄຟລ໌",
        noName: "ຍັງບໍ່ມີຊື່",
        signOut: "ອອກຈາກລະບົບ",
      },

      dangerZone: {
        section: "ເຂດອັນຕະລາຍ",
        deleteAccount: "ລຶບບັນຊີ",
        confirmMessage:
          "ທ່ານແນ່ໃຈບໍ? ການກະທຳນີ້ຈະລຶບບັນຊີ ແລະ ຂໍ້ມູນທັງໝົດຂອງທ່ານຢ່າງຖາວອນ. ບໍ່ສາມາດກູ້ຄືນໄດ້.",
        yesDelete: "ແມ່ນ, ລຶບ",
      },

      about: {
        section: "ກ່ຽວກັບ",
        app: "ແອັບ",
        version: "ເວີຊັນ",
        framework: "Framework",
        builtBy: "ສ້າງໂດຍ",
      },
    },

    // ── Profile page ──────────────────────────────────────────────────────
    profile: {
      title: "ໂປຣໄຟລ໌",
      editProfile: "ແກ້ໄຂໂປຣໄຟລ໌",
      cancelEdit: "ຍົກເລີກການແກ້ໄຂ",
      displayName: "ຊື່ສະແດງ",
      profileImage: "ຮູບໂປຣໄຟລ໌",
      selectImage: "ເລືອກຮູບ",
      clearSelection: "ລ້າງທີ່ເລືອກ",
      removeCurrentImage: "ລຶບຮູບປັດຈຸບັນ",
      chooseAvatar: "ຫຼືເລືອກ Avatar",
      saveChanges: "ບັນທຶກການປ່ຽນແປງ",
      updateDetails: "ອັບເດດຂໍ້ມູນຂອງທ່ານ",
      dashboard: "ໜ້າໂປຣໄຟລ໌",
      dashboardDesc:
        "ຮັກສາຂໍ້ມູນໃຫ້ທັນສະໄໝ ເພື່ອປັບແຕ່ງປະສົບການຂອງທ່ານ.",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      goodMorning: "ສະບາຍດີຕອນເຊົ້າ",
      goodAfternoon: "ສະບາຍດີຕອນສວາຍ",
      goodEvening: "ສະບາຍດີຕອນແລງ",
      goodNight: "ນອນຫຼັບຝັນດີ",
      addATask: "ເພີ່ມວຽກໃໝ່",
      completedToday: "ສຳເລັດມື້ນີ້",
      pending: "ກຳລັງດຳເນີນ",
      dayStreak: "ສະຖິຕິຕໍ່ເນື່ອງ",
      dueToday: "ກຳນົດມື້ນີ້",
      todaysTasks: "ວຽກມື້ນີ້",
      noTasksToday: "ບໍ່ມີວຽກທີ່ກຳນົດມື້ນີ້. ພັກຜ່ອນໃຫ້ສະບາຍ!",
      studyStats: "ສະຖິຕິການຮຽນ",
      total: "ທັງໝົດ",
      noStudySessions: "ຍັງບໍ່ມີສະຖິຕິການຮຽນ. ໄປທີ່ Study Hub ເພື່ອເລີ່ມຕົ້ນ!",
      recentSessions: "ຊ່ວງເວລາຫຼ້າສຸດ",
      openStudyHub: "ເປີດ Study Hub",
      focusTimer: "ໂມງຈັບເວລາຕັ້ງໃຈ",
      selectTaskToFocus: "ເລືອກວຽກທີ່ຈະໂຟກັສ...",
      focusing: "ກຳລັງໂຟກັສ:",
      pomodoroSession: "ຊ່ວງ Pomodoro 25 ນາທີ",
      start: "ເລີ່ມຕົ້ນ",
      pause: "ຢຸດຊົ່ວຄາວ",
      reset: "ຣີເຊັດ",
      weeklyProgress: "ຄວາມຄືບໜ້າປະຈຳອາທິດ",
      recentNotes: "ບັນທຶກຫຼ້າສຸດ",
      noNotesYet: "ຍັງບໍ່ມີບັນທຶກ.",
      viewAllNotes: "ເບິ່ງບັນທຶກທັງໝົດ",
      overdueTasks: "ວຽກທີ່ກາຍກຳນົດ",
      due: "ກຳນົດ:",
    },

    // ── Task pages ────────────────────────────────────────────────────────
    tasks: {
      pending: "ກຳລັງດຳເນີນ",
      completed: "ສຳເລັດ",
      total: "ທັງໝົດ",
      high: "ສູງ",
      medium: "ກາງ",
      low: "ຕ່ຳ",
      work: "ວຽກງານ",
      study: "ການຮຽນ",
      activities: "ກິດຈະກຳ",
      noTasks: "ຍັງບໍ່ມີວຽກ. ມາເພີ່ມວຽກກັນ!",
      noCompletedTasks: "ຍັງບໍ່ມີວຽກທີ່ສຳເລັດ",
      completeTaskHint: "ເຮັດວຽກໃຫ້ສຳເລັດແລ້ວມັນຈະປາກົດຢູ່ທີ່ນີ້",
      addTask: "ເພີ່ມວຽກ",
      deleteTask: "ລຶບວຽກ",
      markDone: "ໝາຍວ່າສຳເລັດ",
      yourTaskList: "ລາຍການວຽກຂອງທ່ານ",
      updateTask: "ອັບເດດວຽກ",
      title: "ຫົວຂໍ້",
      description: "ລາຍລະອຽດ",
      dueDate: "ວັນທີຄົບກຳນົດ",
      dueTime: "ເວລາຄົບກຳນົດ",
      time: "ເວລາ",
      missed: "ພາດກຳນົດ",
      tasksDone: "ວຽກສຳເລັດແລ້ວ",
      completedTasks: "ວຽກທີ່ສຳເລັດແລ້ວ",
      addNewTask: "ເພີ່ມວຽກໃໝ່",
      fillDetails: "ຕື່ມລາຍລະອຽດຂ້າງລຸ່ມນີ້",
      taskTitle: "ຫົວຂໍ້ວຽກ",
      taskType: "ປະເພດວຽກ",
      priorityLevel: "ລະດັບຄວາມສຳຄັນ",
      savingTask: "ກຳລັງບັນທຶກວຽກ...",
    },
  },
};

export type Translations = typeof translations.en;
