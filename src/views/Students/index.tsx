// src/views/Students/index.tsx

import type { FC } from "react";

import typographyStyles from "../../components/ui/Typography.module.css";

const StudentsPage: FC = () => {
  return (
    <div>
      <h1 className={typographyStyles.pageTitle}>学生档案</h1>
      <p className={typographyStyles.pageSubtitle}>Coming Soon</p>
    </div>
  );
};

export default StudentsPage;
