import React from "react";

import { Form } from "../reusable";

const fields = {};

const UpdateItem = ({ item, toggleEdit }) => {
  const handleSubmit = formData => {
    fields &&
      Object.keys(fields).forEach(field => {
        const val = formData[field];
        if (val !== null && typeof val !== "undefined") {
          const val = formData[field] || null;
          item[field] = val;
        }
      });
    item.save();
    toggleEdit();
  };

  return (
    <Form
      fields={fields}
      defaultValues={item}
      onSubmit={handleSubmit}
      onCancel={toggleEdit}
      title="Update Item"
      submitText="Save Item"
    />
  );
};

export default UpdateItem;
