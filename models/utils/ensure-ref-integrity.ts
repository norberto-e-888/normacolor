import {
  CallbackWithoutResultAndOptionalError,
  Document,
  Model,
  Types,
} from "mongoose";

export async function ensureRefIntegrity(
  this: Document,
  next: CallbackWithoutResultAndOptionalError
) {
  for (const path of Object.keys(this.schema.paths)) {
    const ref = this.schema.path(path);

    if (!ref.options["ref"]) {
      continue;
    }

    const parent = this.$parent();
    const modelName = ref.options["ref"];
    const model = parent
      ? parent.db.model<unknown>(modelName)
      : this.db.model<unknown>(modelName);

    if (!model) {
      throw new Error(
        `Document can't be created because model "${modelName}" does not exist.`
      );
    }

    if (ref.instance === "ObjectId") {
      await checkDocExists(model, this.get(path));
    } else if (ref.instance === "Array") {
      const ids: (Types.ObjectId | string)[] = this.get(path);
      for (const id of ids) {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`"${path}" contains invalid ObjectId ${id}`);
        }

        await checkDocExists(model, id);
      }
    } else {
      throw new Error(
        'Model properties with "ref" must be of type "ObjectId" or "Array<ObjectId>".'
      );
    }
  }

  next();
}

async function checkDocExists(
  model: Model<unknown>,
  id: Types.ObjectId | string
) {
  const referencedDoc = await model.findById(
    typeof id === "string" ? id : id.toString()
  );

  if (!referencedDoc) {
    throw new Error(
      `Document can't be created because document referred to with Id "${id}" does not exist for model "${model.name}".`
    );
  }
}
